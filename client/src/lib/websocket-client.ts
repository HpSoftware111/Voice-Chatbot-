import type { WSMessage } from "@shared/schema";

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketClientOptions {
  onMessage?: (message: WSMessage) => void;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private options: Required<WebSocketClientOptions>;
  private url: string;

  constructor(options: WebSocketClientOptions = {}) {
    this.options = {
      onMessage: () => {},
      onStateChange: () => {},
      onError: () => {},
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...options
    };

    // Construct WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = `${protocol}//${window.location.host}/ws`;
  }

  connect(): void {
    if (this.state === 'connecting' || this.state === 'connected') {
      return;
    }

    this.setState('connecting');

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(new Error(`Failed to create WebSocket: ${error}`));
    }
  }

  disconnect(): void {
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.setState('disconnected');
  }

  send(message: any): boolean {
    if (this.state !== 'connected' || !this.ws) {
      console.warn('WebSocket not connected, message not sent:', message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      this.handleError(new Error(`Failed to send message: ${error}`));
      return false;
    }
  }

  getState(): ConnectionState {
    return this.state;
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.setState('connected');
      
      // Connection established successfully
      console.log('WebSocket connection established');
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.ws = null;
      
      if (event.code !== 1000) { // Not a normal closure
        this.attemptReconnect();
      } else {
        this.setState('disconnected');
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleError(new Error('WebSocket connection error'));
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.options.onMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        this.handleError(new Error(`Invalid message format: ${error}`));
      }
    };
  }

  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.options.onStateChange(newState);
    }
  }

  private handleError(error: Error): void {
    console.error('WebSocket client error:', error);
    this.setState('error');
    this.options.onError(error);
    
    // Attempt to reconnect on error
    this.attemptReconnect();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.setState('error');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`);
    
    this.setState('connecting');
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
