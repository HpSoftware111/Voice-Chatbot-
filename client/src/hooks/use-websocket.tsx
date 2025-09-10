import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketClient, type ConnectionState } from '@/lib/websocket-client';
import type { WSMessage } from '@shared/schema';

export interface UseWebSocketOptions {
  onMessage?: (message: WSMessage) => void;
  onError?: (error: Error) => void;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const wsClient = useRef<WebSocketClient | null>(null);

  const { onMessage, onError, autoConnect = true } = options;

  const handleMessage = useCallback((message: WSMessage) => {
    setLastMessage(message);
    
    // Handle connection status updates
    if (message.type === 'connection_status') {
      setActiveUsers(message.data.activeUsers);
    }
    
    // Call custom message handler
    onMessage?.(message);
  }, [onMessage]);

  const handleError = useCallback((error: Error) => {
    console.error('WebSocket error:', error);
    onError?.(error);
  }, [onError]);

  const connect = useCallback(() => {
    if (wsClient.current) {
      wsClient.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsClient.current) {
      wsClient.current.disconnect();
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsClient.current) {
      return wsClient.current.send(message);
    }
    return false;
  }, []);

  const joinMeeting = useCallback((meetingId: string) => {
    return sendMessage({
      type: 'join_meeting',
      meetingId
    });
  }, [sendMessage]);

  const sendAudioStream = useCallback((audioText: string) => {
    return sendMessage({
      type: 'audio_stream',
      audioText
    });
  }, [sendMessage]);

  const sendTextStream = useCallback((partialText: string, speakerInfo: any) => {
    return sendMessage({
      type: 'text_stream',
      partialText,
      speakerInfo
    });
  }, [sendMessage]);

  const sendChatMessage = useCallback((content: string) => {
    return sendMessage({
      type: 'chat_message',
      content
    });
  }, [sendMessage]);

  const stopMeeting = useCallback((meetingId: string) => {
    return sendMessage({
      type: 'stop_meeting',
      meetingId
    });
  }, [sendMessage]);

  useEffect(() => {
    // Initialize WebSocket client
    wsClient.current = new WebSocketClient({
      onMessage: handleMessage,
      onStateChange: setConnectionState,
      onError: handleError,
      reconnectInterval: 3000,
      maxReconnectAttempts: 5
    });

    // Auto-connect if enabled
    if (autoConnect) {
      wsClient.current.connect();
    }

    // Cleanup on unmount
    return () => {
      if (wsClient.current) {
        wsClient.current.disconnect();
      }
    };
  }, [handleMessage, handleError, autoConnect]);

  return {
    connectionState,
    lastMessage,
    activeUsers,
    connect,
    disconnect,
    sendMessage,
    joinMeeting,
    sendAudioStream,
    sendTextStream,
    sendChatMessage,
    stopMeeting,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isDisconnected: connectionState === 'disconnected',
    hasError: connectionState === 'error'
  };
}
