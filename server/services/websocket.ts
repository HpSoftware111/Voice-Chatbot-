import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";
import { transcriptionService } from "./transcription";
import { openaiService } from "./openai";
import type { WSMessage } from "@shared/schema";

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, {
    id: string;
    meetingId?: string;
    lastPing: number;
    isAlive: boolean;
  }> = new Map();
  private pingInterval!: NodeJS.Timeout;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      perMessageDeflate: false
    });

    this.setupWebSocketServer();
    this.startHealthCheck();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      
      // Initialize client metadata
      this.clients.set(ws, {
        id: clientId,
        lastPing: Date.now(),
        isAlive: true
      });

      console.log(`WebSocket client connected: ${clientId}`);

      // Send connection status
      this.sendToClient(ws, {
        type: "connection_status",
        data: {
          connected: true,
          activeUsers: this.clients.size
        }
      });

      // Handle incoming messages
      ws.on('message', async (data: Buffer) => {
        try {
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error("WebSocket message handling error:", error);
          this.sendToClient(ws, {
            type: "error",
            data: {
              message: "Failed to process message",
              code: "MESSAGE_PROCESSING_ERROR"
            }
          });
        }
      });

      // Handle pong responses
      ws.on('pong', () => {
        const clientData = this.clients.get(ws);
        if (clientData) {
          clientData.isAlive = true;
          clientData.lastPing = Date.now();
        }
      });

      // Handle client disconnect
      ws.on('close', (code, reason) => {
        const clientData = this.clients.get(ws);
        if (clientData) {
          console.log(`WebSocket client disconnected: ${clientData.id} (${code}: ${reason})`);
          this.clients.delete(ws);
          
          // Broadcast updated user count
          this.broadcast({
            type: "connection_status",
            data: {
              connected: true,
              activeUsers: this.clients.size
            }
          });
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error("WebSocket error:", error);
        const clientData = this.clients.get(ws);
        if (clientData) {
          this.clients.delete(ws);
        }
      });
    });

    this.wss.on('error', (error) => {
      console.error("WebSocket server error:", error);
    });
  }

  private async handleMessage(ws: WebSocket, data: Buffer): Promise<void> {
    try {
      const message = JSON.parse(data.toString());
      const clientData = this.clients.get(ws);
      
      if (!clientData) {
        throw new Error("Client not found");
      }

      switch (message.type) {
        case 'join_meeting':
          await this.handleJoinMeeting(ws, message.meetingId);
          break;

        case 'audio_stream':
          await this.handleAudioStream(ws, message);
          break;

        case 'text_stream':
          await this.handleTextStream(ws, message);
          break;

        case 'chat_message':
          await this.handleChatMessage(ws, message);
          break;

        case 'stop_meeting':
          await this.handleStopMeeting(ws, message.meetingId);
          break;

        case 'ping':
          this.sendToClient(ws, { type: 'pong', data: { timestamp: Date.now() } });
          break;

        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error("Message parsing error:", error);
      this.sendToClient(ws, {
        type: "error",
        data: {
          message: "Invalid message format",
          code: "INVALID_MESSAGE"
        }
      });
    }
  }

  private async handleJoinMeeting(ws: WebSocket, meetingId: string): Promise<void> {
    const clientData = this.clients.get(ws);
    if (clientData) {
      clientData.meetingId = meetingId;
      
      this.sendToClient(ws, {
        type: "meeting_status",
        data: {
          meetingId,
          status: "active",
          duration: 0,
          speakerCount: 1
        }
      });
    }
  }

  private async handleAudioStream(ws: WebSocket, message: any): Promise<void> {
    const clientData = this.clients.get(ws);
    if (!clientData?.meetingId) {
      throw new Error("No active meeting");
    }

    // Process audio transcription
    await transcriptionService.processAudioStream(
      clientData.meetingId,
      message.audioText,
      (wsMessage: WSMessage) => {
        // Broadcast to all clients in the meeting
        this.broadcastToMeeting(clientData.meetingId!, wsMessage);
      }
    );
  }

  private async handleTextStream(ws: WebSocket, message: any): Promise<void> {
    const clientData = this.clients.get(ws);
    if (!clientData?.meetingId) {
      throw new Error("No active meeting");
    }

    // Process streaming text
    await transcriptionService.processStreamingText(
      clientData.meetingId,
      message.partialText,
      message.speakerInfo,
      (wsMessage: WSMessage) => {
        this.broadcastToMeeting(clientData.meetingId!, wsMessage);
      }
    );
  }

  private async handleChatMessage(ws: WebSocket, message: any): Promise<void> {
    const clientData = this.clients.get(ws);
    if (!clientData?.meetingId) {
      throw new Error("No active meeting");
    }

    try {
      // Stream AI response
      const responseStream = await openaiService.streamChatResponse(
        clientData.meetingId,
        message.content
      );

      // Send streaming response
      for await (const chunk of responseStream) {
        if (ws.readyState === WebSocket.OPEN) {
          this.sendToClient(ws, {
            type: "transcription",
            data: {
              meetingId: clientData.meetingId,
              speakerName: "MeetingFlow AI",
              speakerInitials: "AI",
              speakerColor: "bg-purple-500",
              content: chunk,
              isStreaming: true
            }
          });
        }
      }
    } catch (error) {
      console.error("Chat message error:", error);
      this.sendToClient(ws, {
        type: "error",
        data: {
          message: "Failed to process chat message",
          code: "CHAT_ERROR"
        }
      });
    }
  }

  private async handleStopMeeting(ws: WebSocket, meetingId: string): Promise<void> {
    await transcriptionService.finalizeMeeting(
      meetingId,
      (wsMessage: WSMessage) => {
        this.broadcastToMeeting(meetingId, wsMessage);
      }
    );
  }

  private sendToClient(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error("Failed to send message to client:", error);
      }
    }
  }

  private broadcast(message: WSMessage): void {
    this.clients.forEach((clientData, ws) => {
      this.sendToClient(ws, message);
    });
  }

  private broadcastToMeeting(meetingId: string, message: WSMessage): void {
    this.clients.forEach((clientData, ws) => {
      if (clientData.meetingId === meetingId) {
        this.sendToClient(ws, message);
      }
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startHealthCheck(): void {
    this.pingInterval = setInterval(() => {
      this.clients.forEach((clientData, ws) => {
        if (!clientData.isAlive) {
          console.log(`Terminating inactive client: ${clientData.id}`);
          ws.terminate();
          this.clients.delete(ws);
          return;
        }

        clientData.isAlive = false;
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });

      // Broadcast updated connection count
      this.broadcast({
        type: "connection_status",
        data: {
          connected: true,
          activeUsers: this.clients.size
        }
      });
    }, 30000); // Check every 30 seconds
  }

  getActiveConnections(): number {
    return this.clients.size;
  }

  getActiveMeetings(): number {
    const meetingIds = new Set();
    this.clients.forEach(clientData => {
      if (clientData.meetingId) {
        meetingIds.add(clientData.meetingId);
      }
    });
    return meetingIds.size;
  }

  shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.wss.close(() => {
      console.log("WebSocket server closed");
    });
  }
}
