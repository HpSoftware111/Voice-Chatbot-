import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { TranscriptionPanel } from '@/components/transcription-panel';
import { ActionItemsPanel } from '@/components/action-items-panel';
import { useTranscription } from '@/hooks/use-transcription';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Dashboard() {
  const [currentUser] = useState({
    id: "user_1",
    name: "John Smith",
    initials: "JS",
    role: "Newsletter Publisher"
  });

  const [currentMeeting, setCurrentMeeting] = useState<string | null>(null);
  const { toast } = useToast();

  const {
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
  } = useTranscription(currentMeeting || undefined);

  // Create a new meeting on component mount
  useEffect(() => {
    const createMeeting = async () => {
      try {
        const response = await apiRequest('POST', '/api/meetings', {
          userId: currentUser.id,
          title: `Meeting ${new Date().toLocaleDateString()}`,
          status: 'active'
        });
        
        const meeting = await response.json();
        setCurrentMeeting(meeting.id);
        
        toast({
          title: "Meeting Started",
          description: "Ready for real-time transcription"
        });
      } catch (error) {
        console.error('Failed to create meeting:', error);
        toast({
          title: "Error",
          description: "Failed to start meeting",
          variant: "destructive"
        });
      }
    };

    createMeeting();
  }, [currentUser.id, toast]);

  const handleStopRecording = async () => {
    if (currentMeeting) {
      try {
        await apiRequest('PATCH', `/api/meetings/${currentMeeting}`, {
          status: 'completed'
        });
        
        endMeeting();
        
        toast({
          title: "Meeting Ended",
          description: "Transcription completed and insights generated"
        });
      } catch (error) {
        console.error('Failed to stop meeting:', error);
        toast({
          title: "Error", 
          description: "Failed to stop meeting",
          variant: "destructive"
        });
      }
    }
  };

  const handlePauseRecording = async () => {
    if (currentMeeting) {
      try {
        await apiRequest('PATCH', `/api/meetings/${currentMeeting}`, {
          status: 'paused'
        });
        
        toast({
          title: "Recording Paused",
          description: "Transcription temporarily paused"
        });
      } catch (error) {
        console.error('Failed to pause meeting:', error);
        toast({
          title: "Error",
          description: "Failed to pause recording",
          variant: "destructive"
        });
      }
    }
  };

  const handleExportActionItems = async () => {
    toast({
      title: "Export Started",
      description: "Action items are being exported to your task manager"
    });
  };

  const handleExportTo = async (platform: string) => {
    if (!currentMeeting) return;

    try {
      const response = await apiRequest('POST', `/api/meetings/${currentMeeting}/export`, {
        platform
      });
      
      const result = await response.json();
      
      toast({
        title: "Export Successful",
        description: result.message
      });
    } catch (error) {
      console.error(`Failed to export to ${platform}:`, error);
      toast({
        title: "Export Failed",
        description: `Failed to export to ${platform}`,
        variant: "destructive"
      });
    }
  };

  // Simulate audio input for demo purposes
  useEffect(() => {
    if (!isConnected || !currentMeeting) return;

    const demoMessages = [
      { 
        speaker: 'Alice Miller',
        initials: 'AM',
        color: 'bg-blue-500',
        text: 'Welcome everyone to today\'s newsletter planning meeting. We need to discuss our Q4 content strategy and finalize the holiday campaign timeline.'
      },
      {
        speaker: 'Bob Johnson',
        initials: 'BJ', 
        color: 'bg-green-500',
        text: 'Great, I\'ve prepared the analytics from our last three campaigns. We should definitely focus on the segments that performed best - our tech review content had 45% higher open rates.'
      },
      {
        speaker: 'Carol Martinez',
        initials: 'CM',
        color: 'bg-purple-500',
        text: 'That\'s excellent data. I think we should also look at integrating more interactive content this quarter. Maybe we can schedule a follow-up meeting to discuss the technical implementation.'
      }
    ];

    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < demoMessages.length) {
        const message = demoMessages[messageIndex];
        
        // Simulate streaming text
        let charIndex = 0;
        const streamInterval = setInterval(() => {
          if (charIndex < message.text.length) {
            const partialText = message.text.substring(0, charIndex + 1);
            sendStreamingText(partialText, {
              name: message.speaker,
              initials: message.initials,
              color: message.color
            });
            charIndex += 5; // Add 5 characters at a time
          } else {
            clearInterval(streamInterval);
            // Send final complete message
            sendAudio(message.text);
          }
        }, 100);
        
        messageIndex++;
      } else {
        clearInterval(interval);
      }
    }, 8000); // New message every 8 seconds

    return () => clearInterval(interval);
  }, [isConnected, currentMeeting, sendAudio, sendStreamingText]);

  return (
    <div className="min-h-screen flex" data-testid="dashboard">
      <Sidebar 
        connectionStatus={{
          isConnected,
          activeUsers
        }}
      />
      
      <main className="flex-1 overflow-hidden">
        <Header user={currentUser} activeUsers={activeUsers} />
        
        <div className="flex h-[calc(100vh-80px)]">
          <TranscriptionPanel
            transcriptions={transcriptions}
            meetingStatus={meetingStatus}
            formatDuration={formatDuration}
            onStopRecording={handleStopRecording}
            onPauseRecording={handlePauseRecording}
            onSendMessage={sendMessage}
          />
          
          <ActionItemsPanel
            actionItems={actionItems}
            onToggleActionItem={toggleActionItem}
            onExportActionItems={handleExportActionItems}
            onExportTo={handleExportTo}
          />
        </div>
      </main>
    </div>
  );
}
