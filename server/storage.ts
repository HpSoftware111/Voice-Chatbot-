import { 
  type User, 
  type InsertUser,
  type Meeting,
  type InsertMeeting,
  type Transcription,
  type InsertTranscription,
  type ActionItem,
  type InsertActionItem,
  type MeetingInsight,
  type InsertMeetingInsight
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Meeting operations
  getMeeting(id: string): Promise<Meeting | undefined>;
  getMeetingsByUser(userId: string): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined>;

  // Transcription operations
  getTranscriptionsByMeeting(meetingId: string): Promise<Transcription[]>;
  createTranscription(transcription: InsertTranscription): Promise<Transcription>;
  updateTranscription(id: string, updates: Partial<Transcription>): Promise<Transcription | undefined>;

  // Action item operations
  getActionItemsByMeeting(meetingId: string): Promise<ActionItem[]>;
  createActionItem(actionItem: InsertActionItem): Promise<ActionItem>;
  updateActionItem(id: string, updates: Partial<ActionItem>): Promise<ActionItem | undefined>;

  // Meeting insights operations
  getMeetingInsight(meetingId: string): Promise<MeetingInsight | undefined>;
  createMeetingInsight(insight: InsertMeetingInsight): Promise<MeetingInsight>;
  updateMeetingInsight(meetingId: string, updates: Partial<MeetingInsight>): Promise<MeetingInsight | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private meetings: Map<string, Meeting>;
  private transcriptions: Map<string, Transcription>;
  private actionItems: Map<string, ActionItem>;
  private meetingInsights: Map<string, MeetingInsight>;

  constructor() {
    this.users = new Map();
    this.meetings = new Map();
    this.transcriptions = new Map();
    this.actionItems = new Map();
    this.meetingInsights = new Map();

    // Create default user
    this.createUser({
      username: "john.smith",
      password: "password123",
      name: "John Smith",
      role: "Newsletter Publisher"
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    return this.meetings.get(id);
  }

  async getMeetingsByUser(userId: string): Promise<Meeting[]> {
    return Array.from(this.meetings.values()).filter(
      (meeting) => meeting.userId === userId,
    );
  }

  async createMeeting(insertMeeting: InsertMeeting): Promise<Meeting> {
    const id = randomUUID();
    const meeting: Meeting = {
      ...insertMeeting,
      id,
      duration: insertMeeting.duration || null,
      status: insertMeeting.status || null,
      audioQuality: insertMeeting.audioQuality || null,
      speakerCount: insertMeeting.speakerCount || null,
      language: insertMeeting.language || null,
      startTime: new Date(),
      endTime: null,
    };
    this.meetings.set(id, meeting);
    return meeting;
  }

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined> {
    const meeting = this.meetings.get(id);
    if (!meeting) return undefined;
    
    const updatedMeeting = { ...meeting, ...updates };
    this.meetings.set(id, updatedMeeting);
    return updatedMeeting;
  }

  async getTranscriptionsByMeeting(meetingId: string): Promise<Transcription[]> {
    return Array.from(this.transcriptions.values())
      .filter((t) => t.meetingId === meetingId)
      .sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  }

  async createTranscription(insertTranscription: InsertTranscription): Promise<Transcription> {
    const id = randomUUID();
    const transcription: Transcription = {
      ...insertTranscription,
      id,
      isStreaming: insertTranscription.isStreaming || null,
      timestamp: new Date(),
    };
    this.transcriptions.set(id, transcription);
    return transcription;
  }

  async updateTranscription(id: string, updates: Partial<Transcription>): Promise<Transcription | undefined> {
    const transcription = this.transcriptions.get(id);
    if (!transcription) return undefined;
    
    const updatedTranscription = { ...transcription, ...updates };
    this.transcriptions.set(id, updatedTranscription);
    return updatedTranscription;
  }

  async getActionItemsByMeeting(meetingId: string): Promise<ActionItem[]> {
    return Array.from(this.actionItems.values())
      .filter((item) => item.meetingId === meetingId)
      .sort((a, b) => a.extractedAt!.getTime() - b.extractedAt!.getTime());
  }

  async createActionItem(insertActionItem: InsertActionItem): Promise<ActionItem> {
    const id = randomUUID();
    const actionItem: ActionItem = {
      ...insertActionItem,
      id,
      description: insertActionItem.description || null,
      status: insertActionItem.status || null,
      assignedTo: insertActionItem.assignedTo || null,
      dueDate: insertActionItem.dueDate || null,
      isCompleted: insertActionItem.isCompleted || null,
      extractedAt: new Date(),
    };
    this.actionItems.set(id, actionItem);
    return actionItem;
  }

  async updateActionItem(id: string, updates: Partial<ActionItem>): Promise<ActionItem | undefined> {
    const actionItem = this.actionItems.get(id);
    if (!actionItem) return undefined;
    
    const updatedActionItem = { ...actionItem, ...updates };
    this.actionItems.set(id, updatedActionItem);
    return updatedActionItem;
  }

  async getMeetingInsight(meetingId: string): Promise<MeetingInsight | undefined> {
    return Array.from(this.meetingInsights.values()).find(
      (insight) => insight.meetingId === meetingId,
    );
  }

  async createMeetingInsight(insertInsight: InsertMeetingInsight): Promise<MeetingInsight> {
    const id = randomUUID();
    const insight: MeetingInsight = {
      ...insertInsight,
      id,
      keyTopics: insertInsight.keyTopics && Array.isArray(insertInsight.keyTopics) ? insertInsight.keyTopics : null,
      sentiment: insertInsight.sentiment || null,
      sentimentScore: insertInsight.sentimentScore || null,
      summary: insertInsight.summary || null,
      nextSteps: insertInsight.nextSteps || null,
      generatedAt: new Date(),
    };
    this.meetingInsights.set(id, insight);
    return insight;
  }

  async updateMeetingInsight(meetingId: string, updates: Partial<MeetingInsight>): Promise<MeetingInsight | undefined> {
    const insight = Array.from(this.meetingInsights.values()).find(
      (insight) => insight.meetingId === meetingId,
    );
    if (!insight) return undefined;
    
    const updatedInsight = { ...insight, ...updates };
    this.meetingInsights.set(insight.id, updatedInsight);
    return updatedInsight;
  }
}

export const storage = new MemStorage();
