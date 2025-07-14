import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema, insertMeshNodeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for WebRTC signaling
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store WebSocket connections
  const connections = new Map<string, WebSocket>();
  
  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = Array.from((storage as any).users.values());
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid user data" });
    }
  });
  
  app.get("/api/users/wallet/:address", async (req, res) => {
    try {
      const user = await storage.getUserByWalletAddress(req.params.address);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
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
  
  // WebSocket handling for WebRTC signaling
  wss.on('connection', (ws, req) => {
    const userId = req.url?.split('userId=')[1] || Math.random().toString(36);
    connections.set(userId, ws);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'offer':
          case 'answer':
          case 'ice-candidate':
            // Forward WebRTC signaling messages to the target peer
            const targetWs = connections.get(data.targetUserId);
            if (targetWs && targetWs.readyState === WebSocket.OPEN) {
              targetWs.send(JSON.stringify({
                ...data,
                fromUserId: userId
              }));
            }
            break;
            
          case 'join-room':
            // Notify all other users in the room about the new user
            connections.forEach((otherWs, otherUserId) => {
              if (otherUserId !== userId && otherWs.readyState === WebSocket.OPEN) {
                otherWs.send(JSON.stringify({
                  type: 'user-joined',
                  userId: userId
                }));
              }
            });
            break;
            
          case 'bluetooth-discovery':
            // Broadcast bluetooth discovery to nearby nodes
            connections.forEach((otherWs, otherUserId) => {
              if (otherUserId !== userId && otherWs.readyState === WebSocket.OPEN) {
                otherWs.send(JSON.stringify({
                  type: 'bluetooth-discovered',
                  nodeId: userId,
                  signalStrength: Math.floor(Math.random() * 100)
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    });
    
    ws.on('close', () => {
      connections.delete(userId);
      
      // Notify other users about disconnection
      connections.forEach((otherWs, otherUserId) => {
        if (otherWs.readyState === WebSocket.OPEN) {
          otherWs.send(JSON.stringify({
            type: 'user-left',
            userId: userId
          }));
        }
      });
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      userId: userId
    }));
  });
  
  return httpServer;
}
