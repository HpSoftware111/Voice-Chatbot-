import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './use-websocket';
import type { Transcription, ActionItem, WSMessage } from '@shared/schema';

export interface TranscriptionMessage extends Omit<Transcription, 'id' | 'timestamp'> {
  timestamp: Date;
}

export function useTranscription(meetingId?: string) {
  const [transcriptions, setTranscriptions] = useState<TranscriptionMessage[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [meetingStatus, setMeetingStatus] = useState<{
    status: string;
    duration: number;
    speakerCount: number;
  }>({
    status: 'active',
    duration: 0,
    speakerCount: 1
  });

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'transcription':
        const transcriptionData = message.data;
        
        if (transcriptionData.isStreaming) {
          // Update existing streaming message
          setTranscriptions(prev => {
            const filtered = prev.filter(t => !t.isStreaming || t.speakerName !== transcriptionData.speakerName);
            return [...filtered, {
              ...transcriptionData,
              timestamp: new Date()
            }];
          });
        } else {
          // Add completed transcription
          setTranscriptions(prev => {
            const filtered = prev.filter(t => !t.isStreaming);
            return [...filtered, {
              ...transcriptionData,
              timestamp: new Date()
            }];
          });
        }
        break;

      case 'action_item':
        setActionItems(prev => {
          // Check if action item already exists to avoid duplicates
          const exists = prev.some(item => 
            item.title === message.data.title && 
            item.meetingId === message.data.meetingId
          );
          
          if (!exists) {
            return [...prev, {
              id: `action_${Date.now()}_${Math.random()}`,
              extractedAt: new Date(),
              ...message.data,
              description: message.data.description || null,
              status: message.data.status || null,
              assignedTo: message.data.assignedTo || null,
              dueDate: message.data.dueDate || null,
              isCompleted: message.data.isCompleted || null
            }];
          }
          
          return prev;
        });
        break;

      case 'meeting_status':
        if (message.data.meetingId === meetingId) {
          setMeetingStatus({
            status: message.data.status,
            duration: message.data.duration,
            speakerCount: message.data.speakerCount
          });
        }
        break;

      case 'error':
        console.error('Transcription error:', message.data.message);
        break;
    }
  }, [meetingId]);

  const { 
    connectionState, 
    activeUsers, 
    joinMeeting, 
    sendAudioStream, 
    sendTextStream, 
    sendChatMessage, 
    stopMeeting,
    isConnected 
  } = useWebSocket({
    onMessage: handleMessage
  });

  const startMeeting = useCallback(() => {
    if (meetingId && isConnected) {
      joinMeeting(meetingId);
    }
  }, [meetingId, isConnected, joinMeeting]);

  const sendAudio = useCallback((audioText: string) => {
    if (isConnected) {
      return sendAudioStream(audioText);
    }
    return false;
  }, [isConnected, sendAudioStream]);

  const sendStreamingText = useCallback((partialText: string, speakerInfo: any) => {
    if (isConnected) {
      return sendTextStream(partialText, speakerInfo);
    }
    return false;
  }, [isConnected, sendTextStream]);

  const sendMessage = useCallback((content: string) => {
    if (isConnected) {
      return sendChatMessage(content);
    }
    return false;
  }, [isConnected, sendChatMessage]);

  const endMeeting = useCallback(() => {
    if (meetingId && isConnected) {
      return stopMeeting(meetingId);
    }
    return false;
  }, [meetingId, isConnected, stopMeeting]);

  const toggleActionItem = useCallback((actionItemId: string) => {
    setActionItems(prev => 
      prev.map(item => 
        item.id === actionItemId 
          ? { ...item, isCompleted: !item.isCompleted, status: item.isCompleted ? 'pending' : 'completed' }
          : item
      )
    );
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Auto-join meeting when connected and meetingId is available
  useEffect(() => {
    if (isConnected && meetingId) {
      startMeeting();
    }
  }, [isConnected, meetingId, startMeeting]);

  return {
    transcriptions,
    actionItems,
    meetingStatus,
    connectionState,
    activeUsers,
    isConnected,
    startMeeting,
    sendAudio,
    sendStreamingText,
    sendMessage,
    endMeeting,
    toggleActionItem,
    formatDuration
  };
}
