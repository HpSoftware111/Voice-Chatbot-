import { storage } from "../storage";
import { openaiService } from "./openai";
import type { WSMessage, InsertTranscription, InsertActionItem } from "@shared/schema";

export class TranscriptionService {
  private activeMeetings: Map<string, {
    transcriptionBuffer: string;
    lastActionItemCheck: number;
    speakerMap: Map<string, { name: string; initials: string; color: string }>;
  }> = new Map();

  async processAudioStream(
    meetingId: string, 
    audioText: string, 
    wsCallback: (message: WSMessage) => void
  ): Promise<void> {
    try {
      // Initialize meeting context if not exists
      if (!this.activeMeetings.has(meetingId)) {
        this.activeMeetings.set(meetingId, {
          transcriptionBuffer: "",
          lastActionItemCheck: Date.now(),
          speakerMap: new Map()
        });
      }

      const meetingContext = this.activeMeetings.get(meetingId)!;

      // Process transcription with OpenAI
      const transcriptionResult = await openaiService.processTranscription(
        meetingId, 
        audioText,
        this.getSpeakerContext(meetingContext.speakerMap)
      );

      // Update speaker map
      meetingContext.speakerMap.set(transcriptionResult.speakerName, {
        name: transcriptionResult.speakerName,
        initials: transcriptionResult.speakerInitials,
        color: transcriptionResult.speakerColor
      });

      // Store transcription
      const transcription = await storage.createTranscription({
        meetingId,
        speakerName: transcriptionResult.speakerName,
        speakerInitials: transcriptionResult.speakerInitials,
        speakerColor: transcriptionResult.speakerColor,
        content: transcriptionResult.text,
        isStreaming: false
      });

      // Send real-time transcription update
      wsCallback({
        type: "transcription",
        data: {
          meetingId,
          speakerName: transcription.speakerName,
          speakerInitials: transcription.speakerInitials,
          speakerColor: transcription.speakerColor,
          content: transcription.content,
          isStreaming: false
        }
      });

      // Update transcription buffer
      meetingContext.transcriptionBuffer += ` ${transcriptionResult.text}`;

      // Check for action items every 30 seconds or 500 characters
      const shouldCheckActionItems = 
        Date.now() - meetingContext.lastActionItemCheck > 30000 ||
        meetingContext.transcriptionBuffer.length > 500;

      if (shouldCheckActionItems) {
        await this.extractActionItems(meetingId, meetingContext.transcriptionBuffer, wsCallback);
        meetingContext.lastActionItemCheck = Date.now();
      }

      // Update meeting stats
      await this.updateMeetingStats(meetingId, wsCallback);

    } catch (error) {
      console.error("Transcription processing error:", error);
      wsCallback({
        type: "error",
        data: {
          message: "Failed to process transcription",
          code: "TRANSCRIPTION_ERROR"
        }
      });
    }
  }

  async processStreamingText(
    meetingId: string,
    partialText: string,
    speakerInfo: { name: string; initials: string; color: string },
    wsCallback: (message: WSMessage) => void
  ): Promise<void> {
    try {
      // Send streaming update
      wsCallback({
        type: "transcription",
        data: {
          meetingId,
          speakerName: speakerInfo.name,
          speakerInitials: speakerInfo.initials,
          speakerColor: speakerInfo.color,
          content: partialText,
          isStreaming: true
        }
      });
    } catch (error) {
      console.error("Streaming text error:", error);
    }
  }

  private async extractActionItems(
    meetingId: string, 
    transcriptText: string, 
    wsCallback: (message: WSMessage) => void
  ): Promise<void> {
    try {
      const actionItems = await openaiService.extractActionItems(meetingId, transcriptText);

      for (const item of actionItems) {
        // Store action item
        const actionItem = await storage.createActionItem({
          meetingId,
          title: item.title,
          description: item.description,
          assignedTo: item.assignedTo,
          dueDate: item.dueDate,
          status: "pending",
          isCompleted: false
        });

        // Send real-time action item update
        wsCallback({
          type: "action_item",
          data: {
            meetingId: actionItem.meetingId,
            title: actionItem.title,
            description: actionItem.description || "",
            assignedTo: actionItem.assignedTo || "",
            dueDate: actionItem.dueDate || "",
            status: actionItem.status || "pending",
            isCompleted: actionItem.isCompleted || false
          }
        });
      }
    } catch (error) {
      console.error("Action item extraction error:", error);
    }
  }

  private async updateMeetingStats(
    meetingId: string, 
    wsCallback: (message: WSMessage) => void
  ): Promise<void> {
    try {
      const meeting = await storage.getMeeting(meetingId);
      if (!meeting) return;

      const transcriptions = await storage.getTranscriptionsByMeeting(meetingId);
      const uniqueSpeakers = new Set(transcriptions.map(t => t.speakerName)).size;
      
      const duration = meeting.startTime 
        ? Math.floor((Date.now() - meeting.startTime.getTime()) / 1000)
        : 0;

      // Update meeting record
      await storage.updateMeeting(meetingId, {
        duration,
        speakerCount: uniqueSpeakers
      });

      // Send meeting status update
      wsCallback({
        type: "meeting_status",
        data: {
          meetingId,
          status: meeting.status as "active" | "paused" | "completed",
          duration,
          speakerCount: uniqueSpeakers
        }
      });
    } catch (error) {
      console.error("Meeting stats update error:", error);
    }
  }

  private getSpeakerContext(speakerMap: Map<string, any>): string {
    const speakers = Array.from(speakerMap.values());
    if (speakers.length === 0) return "No previous speakers";
    
    return `Known speakers: ${speakers.map(s => `${s.name} (${s.initials})`).join(", ")}`;
  }

  async finalizeMeeting(
    meetingId: string, 
    wsCallback: (message: WSMessage) => void
  ): Promise<void> {
    try {
      const transcriptions = await storage.getTranscriptionsByMeeting(meetingId);
      const fullTranscript = transcriptions.map(t => `${t.speakerName}: ${t.content}`).join("\n");

      // Generate comprehensive insights
      const insights = await openaiService.generateMeetingInsights(meetingId, fullTranscript);

      // Store insights
      await storage.createMeetingInsight({
        meetingId,
        keyTopics: insights.keyTopics,
        sentiment: insights.sentiment,
        sentimentScore: insights.sentimentScore,
        summary: insights.summary,
        nextSteps: insights.nextSteps
      });

      // Update meeting status
      await storage.updateMeeting(meetingId, {
        status: "completed",
        endTime: new Date()
      });

      // Clean up active meeting context
      this.activeMeetings.delete(meetingId);
      openaiService.clearConversationHistory(meetingId);

      // Send final meeting status
      wsCallback({
        type: "meeting_status",
        data: {
          meetingId,
          status: "completed",
          duration: 0,
          speakerCount: 0
        }
      });

    } catch (error) {
      console.error("Meeting finalization error:", error);
      wsCallback({
        type: "error",
        data: {
          message: "Failed to finalize meeting",
          code: "FINALIZATION_ERROR"
        }
      });
    }
  }

  getActiveMeetingCount(): number {
    return this.activeMeetings.size;
  }
}

export const transcriptionService = new TranscriptionService();
