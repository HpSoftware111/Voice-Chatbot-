import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Square, Pause, Mic, Users, Languages } from 'lucide-react';
import type { TranscriptionMessage } from '@/hooks/use-transcription';

interface TranscriptionPanelProps {
  transcriptions: TranscriptionMessage[];
  meetingStatus: {
    status: string;
    duration: number;
    speakerCount: number;
  };
  formatDuration: (seconds: number) => string;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onSendMessage?: (message: string) => void;
}

export function TranscriptionPanel({ 
  transcriptions, 
  meetingStatus, 
  formatDuration, 
  onStopRecording, 
  onPauseRecording,
  onSendMessage 
}: TranscriptionPanelProps) {
  const [chatMessage, setChatMessage] = useState('');

  const handleSendMessage = () => {
    if (chatMessage.trim() && onSendMessage) {
      onSendMessage(chatMessage);
      setChatMessage('');
    }
  };

  const getSpeakerColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      'bg-blue-500': 'speaker-blue',
      'bg-green-500': 'speaker-green',
      'bg-purple-500': 'speaker-purple',
      'bg-red-500': 'speaker-red',
      'bg-yellow-500': 'speaker-yellow',
      'bg-pink-500': 'speaker-pink',
      'bg-indigo-500': 'speaker-indigo',
      'bg-gray-500': 'speaker-gray'
    };
    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <div className="flex-1 p-6" data-testid="transcription-panel">
      <div className="bg-card rounded-lg border border-border h-full flex flex-col">
        {/* Transcription Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-foreground" data-testid="transcription-title">
                Real-time Transcription
              </h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span data-testid="meeting-duration">
                  {formatDuration(meetingStatus.duration)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={onStopRecording}
                data-testid="button-stop-recording"
              >
                <Square className="w-4 h-4 mr-1" />
                Stop Recording
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={onPauseRecording}
                data-testid="button-pause-recording"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            </div>
          </div>
        </div>
        
        {/* Transcription Content */}
        <div 
          className="flex-1 p-4 overflow-y-auto space-y-4"
          data-testid="transcription-content"
        >
          {transcriptions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8" data-testid="empty-transcription">
              <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start speaking to begin real-time transcription...</p>
            </div>
          ) : (
            transcriptions.map((transcription, index) => (
              <div key={index} className="flex space-x-3" data-testid={`transcription-${index}`}>
                <div 
                  className={`w-8 h-8 ${getSpeakerColorClass(transcription.speakerColor)} rounded-full flex items-center justify-center flex-shrink-0`}
                  data-testid={`speaker-avatar-${index}`}
                >
                  <span className="text-xs font-medium text-white">
                    {transcription.speakerInitials}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-foreground" data-testid={`speaker-name-${index}`}>
                      {transcription.speakerName}
                    </span>
                    <span className="text-xs text-muted-foreground" data-testid={`message-time-${index}`}>
                      {transcription.timestamp.toLocaleTimeString()}
                    </span>
                    {transcription.isStreaming && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    )}
                  </div>
                  <p 
                    className={`text-foreground ${transcription.isStreaming ? 'streaming-text' : ''}`}
                    data-testid={`message-content-${index}`}
                  >
                    {transcription.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Chat Input */}
        {onSendMessage && (
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask MeetingFlow AI a question..."
                className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                data-testid="input-chat-message"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                data-testid="button-send-message"
              >
                Send
              </Button>
            </div>
          </div>
        )}
        
        {/* Transcription Controls */}
        <div className="p-4 border-t border-border bg-muted/50">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground" data-testid="audio-quality">
                Audio quality: Excellent
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-secondary" />
              <span className="text-muted-foreground" data-testid="speaker-count">
                {meetingStatus.speakerCount} speakers detected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Languages className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground" data-testid="language">
                Language: English (US)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
