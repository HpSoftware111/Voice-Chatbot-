import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketManager } from "./services/websocket";
import { insertMeetingSchema, insertActionItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket manager
  const wsManager = new WebSocketManager(httpServer);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
      connections: wsManager.getActiveConnections(),
      activeMeetings: wsManager.getActiveMeetings()
    });
  });

  // User authentication endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user profile
  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new meeting
  app.post("/api/meetings", async (req, res) => {
    try {
      const validatedData = insertMeetingSchema.parse(req.body);
      const meeting = await storage.createMeeting(validatedData);
      res.json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid meeting data", errors: error.errors });
      }
      console.error("Create meeting error:", error);
      res.status(500).json({ message: "Failed to create meeting" });
    }
  });

  // Get meeting details
  app.get("/api/meetings/:id", async (req, res) => {
    try {
      const meeting = await storage.getMeeting(req.params.id);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      const transcriptions = await storage.getTranscriptionsByMeeting(req.params.id);
      const actionItems = await storage.getActionItemsByMeeting(req.params.id);
      const insights = await storage.getMeetingInsight(req.params.id);

      res.json({
        meeting,
        transcriptions,
        actionItems,
        insights
      });
    } catch (error) {
      console.error("Get meeting error:", error);
      res.status(500).json({ message: "Failed to retrieve meeting" });
    }
  });

  // Get meetings for user
  app.get("/api/users/:userId/meetings", async (req, res) => {
    try {
      const meetings = await storage.getMeetingsByUser(req.params.userId);
      res.json(meetings);
    } catch (error) {
      console.error("Get user meetings error:", error);
      res.status(500).json({ message: "Failed to retrieve meetings" });
    }
  });

  // Update meeting status
  app.patch("/api/meetings/:id", async (req, res) => {
    try {
      const { status } = req.body;
      const meeting = await storage.updateMeeting(req.params.id, { 
        status,
        ...(status === "completed" ? { endTime: new Date() } : {})
      });
      
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      res.json(meeting);
    } catch (error) {
      console.error("Update meeting error:", error);
      res.status(500).json({ message: "Failed to update meeting" });
    }
  });

  // Get transcriptions for meeting
  app.get("/api/meetings/:id/transcriptions", async (req, res) => {
    try {
      const transcriptions = await storage.getTranscriptionsByMeeting(req.params.id);
      res.json(transcriptions);
    } catch (error) {
      console.error("Get transcriptions error:", error);
      res.status(500).json({ message: "Failed to retrieve transcriptions" });
    }
  });

  // Get action items for meeting
  app.get("/api/meetings/:id/action-items", async (req, res) => {
    try {
      const actionItems = await storage.getActionItemsByMeeting(req.params.id);
      res.json(actionItems);
    } catch (error) {
      console.error("Get action items error:", error);
      res.status(500).json({ message: "Failed to retrieve action items" });
    }
  });

  // Update action item
  app.patch("/api/action-items/:id", async (req, res) => {
    try {
      const actionItem = await storage.updateActionItem(req.params.id, req.body);
      if (!actionItem) {
        return res.status(404).json({ message: "Action item not found" });
      }
      res.json(actionItem);
    } catch (error) {
      console.error("Update action item error:", error);
      res.status(500).json({ message: "Failed to update action item" });
    }
  });

  // Get meeting insights
  app.get("/api/meetings/:id/insights", async (req, res) => {
    try {
      const insights = await storage.getMeetingInsight(req.params.id);
      if (!insights) {
        return res.status(404).json({ message: "Meeting insights not found" });
      }
      res.json(insights);
    } catch (error) {
      console.error("Get insights error:", error);
      res.status(500).json({ message: "Failed to retrieve insights" });
    }
  });

  // Export endpoints for integrations
  app.post("/api/meetings/:id/export", async (req, res) => {
    try {
      const { platform } = req.body; // notion, trello, slack, email
      const meeting = await storage.getMeeting(req.params.id);
      
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      const actionItems = await storage.getActionItemsByMeeting(req.params.id);
      const insights = await storage.getMeetingInsight(req.params.id);

      // Mock export functionality - in production, integrate with actual APIs
      const exportData = {
        meeting,
        actionItems,
        insights,
        platform,
        exportedAt: new Date().toISOString(),
        status: "success"
      };

      res.json({ 
        message: `Successfully exported to ${platform}`,
        data: exportData
      });
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export meeting data" });
    }
  });

  // WebSocket connection stats
  app.get("/api/stats/connections", (req, res) => {
    res.json({
      activeConnections: wsManager.getActiveConnections(),
      activeMeetings: wsManager.getActiveMeetings(),
      timestamp: new Date().toISOString()
    });
  });

  // Graceful shutdown handler
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    wsManager.shutdown();
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });

  return httpServer;
}
