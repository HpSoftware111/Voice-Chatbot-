import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").default("Newsletter Publisher"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  status: text("status").default("active"), // active, paused, completed
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  audioQuality: text("audio_quality").default("excellent"),
  speakerCount: integer("speaker_count").default(1),
  language: text("language").default("en-US"),
});

export const transcriptions = pgTable("transcriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").references(() => meetings.id).notNull(),
  speakerName: text("speaker_name").notNull(),
  speakerInitials: text("speaker_initials").notNull(),
  speakerColor: text("speaker_color").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isStreaming: boolean("is_streaming").default(false),
});

export const actionItems = pgTable("action_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").references(() => meetings.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: text("assigned_to"),
  dueDate: text("due_date"),
  status: text("status").default("pending"), // pending, completed
  isCompleted: boolean("is_completed").default(false),
  extractedAt: timestamp("extracted_at").defaultNow(),
});

export const meetingInsights = pgTable("meeting_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").references(() => meetings.id).notNull(),
  keyTopics: jsonb("key_topics").$type<string[]>(),
  sentiment: text("sentiment"), // positive, neutral, negative
  sentimentScore: text("sentiment_score"),
  summary: text("summary"),
  nextSteps: text("next_steps"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  startTime: true,
});

export const insertTranscriptionSchema = createInsertSchema(transcriptions).omit({
  id: true,
  timestamp: true,
});

export const insertActionItemSchema = createInsertSchema(actionItems).omit({
  id: true,
  extractedAt: true,
});

export const insertMeetingInsightSchema = createInsertSchema(meetingInsights).omit({
  id: true,
  generatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

export type InsertTranscription = z.infer<typeof insertTranscriptionSchema>;
export type Transcription = typeof transcriptions.$inferSelect;

export type InsertActionItem = z.infer<typeof insertActionItemSchema>;
export type ActionItem = typeof actionItems.$inferSelect;

export type InsertMeetingInsight = z.infer<typeof insertMeetingInsightSchema>;
export type MeetingInsight = typeof meetingInsights.$inferSelect;

// WebSocket message types
export const wsMessageSchema = z.union([
  z.object({
    type: z.literal("transcription"),
    data: z.object({
      meetingId: z.string(),
      speakerName: z.string(),
      speakerInitials: z.string(),
      speakerColor: z.string(),
      content: z.string(),
      isStreaming: z.boolean(),
    }),
  }),
  z.object({
    type: z.literal("action_item"),
    data: insertActionItemSchema,
  }),
  z.object({
    type: z.literal("meeting_status"),
    data: z.object({
      meetingId: z.string(),
      status: z.enum(["active", "paused", "completed"]),
      duration: z.number(),
      speakerCount: z.number(),
    }),
  }),
  z.object({
    type: z.literal("error"),
    data: z.object({
      message: z.string(),
      code: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("connection_status"),
    data: z.object({
      connected: z.boolean(),
      activeUsers: z.number(),
    }),
  }),
  z.object({
    type: z.literal("ping"),
    data: z.object({}).optional(),
  }),
  z.object({
    type: z.literal("pong"),
    data: z.object({
      timestamp: z.number(),
    }),
  }),
]);

export type WSMessage = z.infer<typeof wsMessageSchema>;
