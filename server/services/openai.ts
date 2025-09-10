import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface TranscriptionResponse {
  text: string;
  speakerName: string;
  speakerInitials: string;
  speakerColor: string;
}

export interface ActionItemResponse {
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
}

export interface InsightResponse {
  keyTopics: string[];
  sentiment: string;
  sentimentScore: string;
  summary: string;
  nextSteps: string;
}

export class OpenAIService {
  private conversationHistory: Map<string, ChatCompletionMessageParam[]> = new Map();
  private readonly systemPrompt = `You are MeetingFlow, an AI assistant specialized in transcribing meetings for newsletter publishers and content creators. You help extract actionable insights, identify speakers, and highlight important action items.

Your responses should be:
- Professional but conversational
- Focused on content strategy and newsletter publishing
- Helpful in identifying actionable tasks
- Natural and human-like, avoiding robotic language
- Contextually aware of previous conversation

When processing meeting content, focus on:
- Content strategy discussions
- Editorial calendar planning
- Audience engagement metrics
- Campaign performance reviews
- Team assignments and deadlines
- Tool integrations and workflows`;

  async processTranscription(
    meetingId: string, 
    audioText: string, 
    speakerContext?: string
  ): Promise<TranscriptionResponse> {
    try {
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: this.systemPrompt },
        { 
          role: "user", 
          content: `Process this meeting transcription and identify the speaker. If speaker context is provided, use it to maintain consistency.
          
          Audio text: "${audioText}"
          Speaker context: ${speakerContext || "New speaker"}
          
          Respond with JSON in this format:
          {
            "text": "cleaned and formatted transcription",
            "speakerName": "Speaker Full Name",
            "speakerInitials": "XX", 
            "speakerColor": "css-color-class"
          }` 
        }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      // Update conversation history
      this.updateConversationHistory(meetingId, messages, response.choices[0].message.content || "");

      return {
        text: result.text || audioText,
        speakerName: result.speakerName || "Unknown Speaker",
        speakerInitials: result.speakerInitials || "US",
        speakerColor: result.speakerColor || "bg-gray-500"
      };
    } catch (error) {
      console.error("OpenAI transcription processing error:", error);
      throw new Error("Failed to process transcription: " + (error as Error).message);
    }
  }

  async extractActionItems(meetingId: string, transcriptText: string): Promise<ActionItemResponse[]> {
    try {
      const context = this.getConversationContext(meetingId);
      
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: this.systemPrompt },
        ...context,
        {
          role: "user",
          content: `Analyze this meeting transcript and extract action items relevant to newsletter publishing and content creation.

          Transcript: "${transcriptText}"

          Focus on identifying:
          - Content creation tasks
          - Editorial deadlines
          - Campaign planning items
          - Tool integrations
          - Follow-up meetings
          - Performance analysis tasks

          Respond with JSON in this format:
          {
            "actionItems": [
              {
                "title": "Brief action title",
                "description": "Detailed description",
                "assignedTo": "Person name if mentioned",
                "dueDate": "Timeframe if mentioned"
              }
            ]
          }`
        }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      this.updateConversationHistory(meetingId, messages, response.choices[0].message.content || "");

      return result.actionItems || [];
    } catch (error) {
      console.error("OpenAI action item extraction error:", error);
      throw new Error("Failed to extract action items: " + (error as Error).message);
    }
  }

  async generateMeetingInsights(meetingId: string, fullTranscript: string): Promise<InsightResponse> {
    try {
      const context = this.getConversationContext(meetingId);
      
      const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: this.systemPrompt },
        ...context,
        {
          role: "user",
          content: `Analyze this complete meeting transcript and provide insights for newsletter publishers.

          Full transcript: "${fullTranscript}"

          Generate comprehensive insights including:
          - Key discussion topics
          - Overall sentiment and team dynamics
          - Strategic next steps
          - Summary of decisions made

          Respond with JSON in this format:
          {
            "keyTopics": ["topic1", "topic2", "topic3"],
            "sentiment": "positive|neutral|negative",
            "sentimentScore": "descriptive explanation",
            "summary": "3-4 sentence meeting summary",
            "nextSteps": "Key next steps and recommendations"
          }`
        }
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      this.updateConversationHistory(meetingId, messages, response.choices[0].message.content || "");

      return {
        keyTopics: result.keyTopics || [],
        sentiment: result.sentiment || "neutral",
        sentimentScore: result.sentimentScore || "Neutral meeting tone",
        summary: result.summary || "Meeting discussion completed",
        nextSteps: result.nextSteps || "Follow up on discussed items"
      };
    } catch (error) {
      console.error("OpenAI insights generation error:", error);
      throw new Error("Failed to generate meeting insights: " + (error as Error).message);
    }
  }

  async streamChatResponse(meetingId: string, userMessage: string): Promise<AsyncIterableIterator<string>> {
    const context = this.getConversationContext(meetingId);
    
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: this.systemPrompt },
      ...context,
      { role: "user", content: userMessage }
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-5",
      messages,
      stream: true,
      temperature: 0.7,
    });

    return this.processStreamResponse(stream, meetingId, messages);
  }

  private async *processStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    meetingId: string,
    messages: ChatCompletionMessageParam[]
  ): AsyncIterableIterator<string> {
    let fullResponse = "";
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        yield content;
      }
    }

    // Update conversation history with complete response
    this.updateConversationHistory(meetingId, messages, fullResponse);
  }

  private getConversationContext(meetingId: string): ChatCompletionMessageParam[] {
    const history = this.conversationHistory.get(meetingId) || [];
    // Keep last 10 exchanges to maintain context without hitting token limits
    return history.slice(-20);
  }

  private updateConversationHistory(
    meetingId: string, 
    messages: ChatCompletionMessageParam[], 
    assistantResponse: string
  ): void {
    let history = this.conversationHistory.get(meetingId) || [];
    
    // Add user message and assistant response
    const userMessage = messages[messages.length - 1];
    if (userMessage.role === "user") {
      history.push(userMessage);
      history.push({ role: "assistant", content: assistantResponse });
    }

    // Maintain context window
    if (history.length > 40) {
      history = history.slice(-30);
    }

    this.conversationHistory.set(meetingId, history);
  }

  clearConversationHistory(meetingId: string): void {
    this.conversationHistory.delete(meetingId);
  }
}

export const openaiService = new OpenAIService();
