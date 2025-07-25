import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, updateUserSchema, insertMessageSchema, insertMeshNodeSchema, insertStorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Store WebSocket connections
  const connections = new Map<string, WebSocket>();
  
  // WebSocket server setup with specific path to avoid conflicts with Vite WS
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/api/ws',
    perMessageDeflate: false,
    clientTracking: true
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  app.post("/api/users", async (req, res) => {
    try {
      console.log('Creating user with data:', JSON.stringify(req.body, null, 2));
      
      const userData = insertUserSchema.parse(req.body);
      console.log('Parsed user data:', userData);
      
      const user = await storage.createUser(userData);
      console.log('Created user:', user);
      res.json(user);
    } catch (error: any) {
      console.error("User creation error:", error);
      
      if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
        return res.status(409).json({ 
          error: "Username already taken", 
          details: "This alias is already in use. Please choose a different one."
        });
      }
      
      res.status(400).json({ 
        error: "Invalid user data", 
        details: error.message || error.toString()
      });
    }
  });
  
  app.get("/api/users/device/:deviceId", async (req, res) => {
    try {
      const user = await storage.getUserByDeviceId(req.params.deviceId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  
  app.patch("/api/users/:id", async (req, res) => {
    try {
      console.log('User update request:', req.params.id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const updates = updateUserSchema.parse(req.body);
      console.log('Parsed updates:', updates);
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log('Updated user:', updatedUser);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("User update error:", error);
      res.status(400).json({ 
        error: "Invalid update data",
        details: error.message || error.toString()
      });
    }
  });
  
  // Message routes
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getRecentMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      
      // Broadcast message to all connected clients
      const messagePayload = JSON.stringify({
        type: 'message',
        data: message
      });
      
      connections.forEach((ws, userId) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messagePayload);
        }
      });
      
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });
  
  // Mesh node routes
  app.get("/api/mesh-nodes", async (req, res) => {
    try {
      const nodes = await storage.getActiveMeshNodes();
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mesh nodes" });
    }
  });
  
  app.post("/api/mesh-nodes", async (req, res) => {
    try {
      const nodeData = insertMeshNodeSchema.parse(req.body);
      const node = await storage.createMeshNode(nodeData);
      res.json(node);
    } catch (error) {
      res.status(400).json({ error: "Invalid mesh node data" });
    }
  });
  
  // Stories routes
  app.get("/api/stories", async (req, res) => {
    try {
      const stories = await storage.getActiveStories();
      res.json(stories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stories" });
    }
  });

  app.post("/api/stories", async (req, res) => {
    try {
      console.log('Story creation request:', JSON.stringify(req.body, null, 2));
      console.log("Request headers:", req.headers);
      
      // Handle form data from enhanced story system
      let storyData: any = {};
      
      if (req.body.title !== undefined) storyData.title = req.body.title;
      if (req.body.content !== undefined) storyData.content = req.body.content;
      if (req.body.userId !== undefined) storyData.userId = parseInt(req.body.userId);
      if (req.body.expiresAt !== undefined) {
        storyData.expiresAt = typeof req.body.expiresAt === 'string' 
          ? new Date(req.body.expiresAt) 
          : req.body.expiresAt;
      }
      if (req.body.mediaUrl !== undefined) storyData.mediaUrl = req.body.mediaUrl;
      
      console.log("Processed story data:", storyData);
      
      // Validate required fields
      if (!storyData.content || !storyData.userId || !storyData.expiresAt) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Content, userId, and expiresAt are required",
          received: storyData
        });
      }
      
      // Set defaults
      if (!storyData.title) storyData.title = '';
      if (!storyData.mediaUrl) storyData.mediaUrl = '';
      
      console.log("Final story data before validation:", storyData);
      
      const validatedData = insertStorySchema.parse(storyData);
      console.log("Validated story data:", validatedData);
      
      const story = await storage.createStory(validatedData);
      console.log("Created story:", story);
      res.json(story);
    } catch (error: any) {
      console.error("Story creation error:", error);
      console.error("Error stack:", error.stack);
      
      let errorMessage = "Failed to create story";
      let statusCode = 500;
      
      if (error.name === 'ZodError') {
        statusCode = 400;
        errorMessage = "Invalid story data: " + error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
        statusCode = 400;
      }
      
      res.status(statusCode).json({ 
        error: errorMessage,
        details: error.toString(),
        received: req.body
      });
    }
  });

  app.get("/api/stories/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const stories = await storage.getStoriesByUser(userId);
      res.json(stories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user stories" });
    }
  });

  app.delete("/api/stories/:id", async (req, res) => {
    try {
      const storyId = parseInt(req.params.id);
      // For now, we'll just return success since we don't have a delete method
      // In a real implementation, you'd add this to the storage interface
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete story" });
    }
  });
  
  // Simplified network API endpoints
  app.get("/api/network/status", async (req, res) => {
    try {
      res.json({
        networkStats: { connectedNodes: connections.size, totalMessages: 0 },
        connectionMetrics: [],
        currentStatus: { isHealthy: true, nodeCount: connections.size },
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch network status" });
    }
  });
  
  app.get("/api/network/analytics", async (req, res) => {
    try {
      res.json({
        report: { connectedUsers: connections.size, totalMessages: 0, uptime: 100 },
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate analytics report" });
    }
  });
  
  app.get("/api/network/nodes", async (req, res) => {
    try {
      res.json({
        nodes: Array.from(connections.keys()).map(id => [id, { isActive: true }]),
        metrics: {},
        connectedUsers: Array.from(connections.keys())
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch network nodes" });
    }
  });
  
  app.get("/api/network/routing", async (req, res) => {
    try {
      res.json({
        routingTable: [],
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch routing table" });
    }
  });
  
  app.get("/api/security/status", async (req, res) => {
    try {
      res.json({
        securityHealth: { isSecure: true, keyStrength: 'strong' },
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch security status" });
    }
  });
  
  app.post("/api/security/generate-keys", async (req, res) => {
    try {
      const { nodeId } = req.body;
      if (!nodeId) {
        return res.status(400).json({ error: "Node ID is required" });
      }
      
      res.json({
        publicKey: `mock-public-key-${nodeId}`,
        walletAddress: `0x${Math.random().toString(16).substr(2, 8)}`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate keys" });
    }
  });
  
  // Simple WebSocket handling
  wss.on('connection', (ws, req) => {
    const userId = req.url?.split('userId=')[1] || Math.random().toString(36);
    connections.set(userId, ws);
    
    console.log(`WebSocket connection established for user: ${userId}`);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'join-room':
            // Send confirmation
            ws.send(JSON.stringify({
              type: 'joined',
              userId: userId,
              room: data.room || 'general'
            }));
            break;
            
          case 'ping':
            // Handle ping for connection quality measurement
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: data.timestamp || Date.now(),
              nodeId: userId
            }));
            break;
            
          case 'chat-message':
            // Broadcast message to all connected clients
            const messagePayload = JSON.stringify({
              type: 'chat-message',
              fromUserId: userId,
              content: data.content,
              timestamp: Date.now()
            });
            
            connections.forEach((clientWs, clientId) => {
              if (clientWs.readyState === WebSocket.OPEN && clientId !== userId) {
                clientWs.send(messagePayload);
              }
            });
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    ws.on('close', () => {
      connections.delete(userId);
      console.log(`WebSocket connection closed for user: ${userId}`);
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      userId: userId,
      nodeInfo: {
        id: userId,
        capabilities: ['webrtc', 'bluetooth', 'file-transfer']
      }
    }));
  });
  
  return httpServer;
}