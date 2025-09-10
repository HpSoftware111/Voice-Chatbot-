import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Users, 
  Clock,
  Volume2,
  VolumeX,
  MessageSquare,
  CheckSquare,
  Zap,
  FileText,
  Download
} from 'lucide-react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useTranscription } from '@/hooks/use-transcription';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { WSMessage } from '@shared/schema';

interface MeetingStatus {
  meetingId: string | null;
  status: 'idle' | 'active' | 'paused' | 'completed';
  duration: number;
  speakerCount: number;
  startTime: Date | null;
}

export default function LiveTranscription() {
  const [currentUser] = useState({
    id: "user_1",
    name: "John Smith",
    initials: "JS",
    role: "Newsletter Publisher"
  });

  const [meetingStatus, setMeetingStatus] = useState<MeetingStatus>({
    meetingId: null,
    status: 'idle',
    duration: 0,
    speakerCount: 0,
    startTime: null
  });

  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>({});
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Use single transcription hook that manages WebSocket internally
  const { 
    transcriptions, 
    actionItems: hookActionItems,
    meetingStatus: hookMeetingStatus,
    connectionState,
    activeUsers,
    isConnected,
    startMeeting,
    sendStreamingText,
    sendMessage: sendChatToServer,
    endMeeting
  } = useTranscription(meetingStatus.meetingId || undefined);

  // Handle incoming WebSocket messages
  function handleWebSocketMessage(message: WSMessage) {
    switch (message.type) {
      case 'action_item':
        setActionItems(prev => [...prev, message.data]);
        toast({
          title: "New Action Item",
          description: message.data.title
        });
        break;
      
      case 'meeting_status':
        setMeetingStatus(prev => ({
          ...prev,
          meetingId: message.data.meetingId,
          status: message.data.status as any,
          duration: message.data.duration,
          speakerCount: message.data.speakerCount
        }));
        break;
      
      case 'error':
        toast({
          title: "Meeting Error",
          description: message.data.message,
          variant: "destructive"
        });
        break;
    }
  }

  // Auto-scroll to bottom when new transcriptions arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptions]);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Start a new meeting
  const handleStartMeeting = async () => {
    try {
      const response = await apiRequest('POST', '/api/meetings', {
        title: `Live Meeting - ${new Date().toLocaleDateString()}`,
        status: 'active'
      });
      const meeting = await response.json();
      
      setMeetingStatus({
        meetingId: meeting.id,
        status: 'active',
        duration: 0,
        speakerCount: 1,
        startTime: new Date()
      });

      // Start the meeting and transcription
      if (startMeeting) {
        startMeeting();
      }
      setIsRecording(true);
      
      toast({
        title: "Meeting Started",
        description: "Live transcription is now active"
      });
    } catch (error) {
      toast({
        title: "Failed to Start Meeting",
        description: "Could not initialize meeting session",
        variant: "destructive"
      });
    }
  };

  // Pause/resume meeting
  const handleTogglePause = () => {
    if (meetingStatus.status === 'active') {
      setMeetingStatus(prev => ({ ...prev, status: 'paused' }));
      setIsRecording(false);
    } else if (meetingStatus.status === 'paused') {
      setMeetingStatus(prev => ({ ...prev, status: 'active' }));
      setIsRecording(true);
    }
  };

  // Stop meeting
  const handleStopMeeting = async () => {
    if (meetingStatus.meetingId) {
      try {
        if (endMeeting) {
          endMeeting();
        }
        
        setMeetingStatus({
          meetingId: null,
          status: 'idle',
          duration: 0,
          speakerCount: 0,
          startTime: null
        });
        setIsRecording(false);
        
        toast({
          title: "Meeting Ended",
          description: "Transcription saved and meeting completed"
        });
      } catch (error) {
        toast({
          title: "Error Ending Meeting",
          description: "There was an issue stopping the meeting",
          variant: "destructive"
        });
      }
    }
  };

  // Toggle microphone
  const handleToggleMicrophone = () => {
    setIsMicrophoneEnabled(!isMicrophoneEnabled);
    if (!isMicrophoneEnabled) {
      // Simulate microphone level
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      setTimeout(() => clearInterval(interval), 5000);
    }
  };

  // Send chat message
  const handleSendChatMessage = () => {
    if (newChatMessage.trim() && meetingStatus.meetingId) {
      const message = {
        id: Date.now().toString(),
        content: newChatMessage,
        sender: currentUser.name,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, message]);
      if (sendChatToServer) {
        sendChatToServer(newChatMessage);
      }
      setNewChatMessage('');
    }
  };

  // Simulate text input for testing
  const handleTestTranscription = () => {
    if (meetingStatus.meetingId) {
      const testTexts = [
        "Let's discuss the quarterly newsletter performance metrics.",
        "We need to focus on improving our subscriber engagement rates.",
        "Action item: Create a content calendar for next month's campaigns.",
        "The analytics show a 15% increase in open rates this quarter."
      ];
      
      const randomText = testTexts[Math.floor(Math.random() * testTexts.length)];
      if (sendStreamingText) {
        sendStreamingText(randomText, {
          speakerName: currentUser.name,
          speakerInitials: currentUser.initials,
          speakerColor: '#3b82f6'
        });
      }
    }
  };

  const speakerColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen flex" data-testid="live-transcription-page">
      <Sidebar 
        connectionStatus={{
          isConnected: connectionState === 'connected',
          activeUsers
        }}
      />
      
      <main className="flex-1 overflow-hidden">
        <Header user={currentUser} activeUsers={activeUsers} />
        
        <div className="h-[calc(100vh-64px)] flex">
          {/* Main Transcription Area */}
          <div className="flex-1 flex flex-col">
            {/* Meeting Controls */}
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      connectionState === 'connected' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {connectionState === 'connected' ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  
                  {meetingStatus.status !== 'idle' && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span data-testid="meeting-duration">
                          {formatDuration(meetingStatus.duration)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span data-testid="speaker-count">
                          {meetingStatus.speakerCount} speakers
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {meetingStatus.status === 'idle' ? (
                    <Button 
                      onClick={handleStartMeeting}
                      disabled={connectionState !== 'connected'}
                      data-testid="button-start-meeting"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Meeting
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleTogglePause}
                        data-testid="button-toggle-pause"
                      >
                        {meetingStatus.status === 'active' ? (
                          <><Pause className="w-4 h-4 mr-2" />Pause</>
                        ) : (
                          <><Play className="w-4 h-4 mr-2" />Resume</>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleStopMeeting}
                        data-testid="button-stop-meeting"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleMicrophone}
                    className={isMicrophoneEnabled ? 'bg-green-100 border-green-300' : ''}
                    data-testid="button-toggle-microphone"
                  >
                    {isMicrophoneEnabled ? (
                      <><Mic className="w-4 h-4 mr-2" />Mic On</>
                    ) : (
                      <><MicOff className="w-4 h-4 mr-2" />Mic Off</>
                    )}
                  </Button>

                  {isMicrophoneEnabled && (
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                      <Progress value={audioLevel} className="w-20" />
                    </div>
                  )}

                  <Badge variant={isRecording ? "default" : "secondary"} data-testid="recording-status">
                    {isRecording ? '● Recording' : '○ Not Recording'}
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestTranscription}
                  disabled={meetingStatus.status === 'idle'}
                  data-testid="button-test-transcription"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Test Transcription
                </Button>
              </div>
            </div>

            {/* Transcription Display */}
            <div className="flex-1 overflow-hidden">
              <div 
                ref={scrollRef}
                className="h-full overflow-y-auto p-4 space-y-3"
                data-testid="transcription-display"
              >
                {transcriptions.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Ready for Transcription</h3>
                      <p className="text-sm">
                        {meetingStatus.status === 'idle' 
                          ? 'Start a meeting to begin live transcription'
                          : 'Use the "Test Transcription" button to see sample messages'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  transcriptions.map((transcription, index) => (
                    <div key={index} className="flex gap-3 group" data-testid={`transcription-${index}`}>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                        style={{ backgroundColor: transcription.speakerColor }}
                      >
                        {transcription.speakerInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm" data-testid={`speaker-name-${index}`}>
                            {transcription.speakerName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {transcription.timestamp.toLocaleTimeString()}
                          </span>
                          {transcription.isStreaming && (
                            <Badge variant="outline" className="text-xs">
                              Speaking...
                            </Badge>
                          )}
                        </div>
                        <p 
                          className={`text-sm ${transcription.isStreaming ? 'text-muted-foreground italic' : 'text-foreground'}`}
                          data-testid={`transcription-content-${index}`}
                        >
                          {transcription.content}
                          {transcription.isStreaming && <span className="animate-pulse">|</span>}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Action Items & Chat */}
          <div className="w-80 border-l bg-muted/30 flex flex-col">
            {/* Action Items */}
            <div className="flex-1 p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Action Items ({actionItems.length})
              </h3>
              <div className="space-y-2 mb-6" data-testid="action-items-list">
                {actionItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Action items will appear here automatically as they're detected in the conversation.
                  </p>
                ) : (
                  actionItems.map((item, index) => (
                    <Card key={index} className="p-3">
                      <p className="text-sm font-medium" data-testid={`action-item-${index}`}>
                        {item.title}
                      </p>
                      {item.assignedTo && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigned to: {item.assignedTo}
                        </p>
                      )}
                    </Card>
                  ))
                )}
              </div>

              {/* Real-time Insights */}
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Live Insights
              </h3>
              <div className="space-y-2" data-testid="live-insights">
                {Object.keys(insights).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    AI insights will be generated as the meeting progresses.
                  </p>
                ) : (
                  <Card className="p-3">
                    <p className="text-sm">{insights.summary}</p>
                  </Card>
                )}
              </div>
            </div>

            {/* Chat */}
            <div className="border-t p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Meeting Chat
              </h3>
              
              <div className="space-y-2 mb-3 max-h-32 overflow-y-auto" data-testid="chat-messages">
                {chatMessages.map((message, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{message.sender}:</span>
                    <span className="ml-2">{message.content}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  disabled={meetingStatus.status === 'idle'}
                  data-testid="input-chat-message"
                />
                <Button 
                  size="sm"
                  onClick={handleSendChatMessage}
                  disabled={!newChatMessage.trim() || meetingStatus.status === 'idle'}
                  data-testid="button-send-chat"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}