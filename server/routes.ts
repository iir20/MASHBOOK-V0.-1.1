import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, updateUserSchema, insertMessageSchema, insertMeshNodeSchema, insertStorySchema } from "@shared/schema";
import { ConnectionManager } from "./networking/ConnectionManager";
import { MeshRouter } from "./networking/MeshRouter";
import { CryptoManager } from "./security/CryptoManager";
import { FileTransferManager } from "./data_transfer/FileTransferManager";
import { NetworkAnalytics } from "./ui/NetworkAnalytics";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize advanced networking infrastructure
  const connectionManager = new ConnectionManager();
  const meshRouter = new MeshRouter('server-node');
  const cryptoManager = new CryptoManager();
  const fileTransferManager = new FileTransferManager();
  const networkAnalytics = new NetworkAnalytics();
  
  // Store WebSocket connections
  const connections = new Map<string, WebSocket>();
  
  // WebSocket server for WebRTC signaling with improved connection handling
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    perMessageDeflate: false
  });
  
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
      const userId = parseInt(req.params.id);
      const updates = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
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
      const storyData = insertStorySchema.parse(req.body);
      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      res.status(400).json({ error: "Invalid story data" });
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
  
  // Advanced networking API endpoints
  app.get("/api/network/status", async (req, res) => {
    try {
      const networkStats = meshRouter.getNetworkStats();
      const connectionMetrics = connectionManager.getAllMetrics();
      const currentStatus = networkAnalytics.getCurrentNetworkStatus();
      
      res.json({
        networkStats,
        connectionMetrics: Array.from(connectionMetrics.entries()),
        currentStatus,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch network status" });
    }
  });
  
  app.get("/api/network/analytics", async (req, res) => {
    try {
      const period = req.query.period as 'hour' | 'day' | 'week' | 'month' || 'hour';
      const report = networkAnalytics.generateReport(period);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate analytics report" });
    }
  });
  
  app.get("/api/network/nodes", async (req, res) => {
    try {
      const nodes = meshRouter.getNodes();
      const nodeMetrics = {};
      
      for (const [nodeId] of Array.from(nodes.entries())) {
        (nodeMetrics as any)[nodeId] = networkAnalytics.getNodeMetrics(nodeId, 10);
      }
      
      res.json({
        nodes: Array.from(nodes.entries()),
        metrics: nodeMetrics,
        connectedUsers: connectionManager.getConnectedUsers()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch network nodes" });
    }
  });
  
  app.get("/api/network/routing", async (req, res) => {
    try {
      const routingTable = meshRouter.getRoutingTable();
      res.json({
        routingTable: Array.from(routingTable.entries()),
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch routing table" });
    }
  });
  
  app.get("/api/security/status", async (req, res) => {
    try {
      const securityHealth = cryptoManager.getSecurityHealth();
      res.json({
        securityHealth,
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
      
      const keyPair = cryptoManager.generateKeyPair(nodeId);
      res.json({
        publicKey: keyPair.publicKey,
        // Don't send private key in response for security
        walletAddress: cryptoManager.generateWalletAddress(keyPair.publicKey)
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate keys" });
    }
  });
  
  app.get("/api/transfers/status", async (req, res) => {
    try {
      const activeTransfers = fileTransferManager.getActiveTransfers();
      const statistics = fileTransferManager.getTransferStatistics();
      
      res.json({
        activeTransfers,
        statistics,
        timestamp: Date.now()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transfer status" });
    }
  });
  
  app.post("/api/transfers/initiate", async (req, res) => {
    try {
      const transferData = req.body;
      transferData.id = transferData.id || `transfer-${Date.now()}`;
      transferData.timestamp = Date.now();
      
      await fileTransferManager.initiateTransfer(transferData);
      res.json({ success: true, transferId: transferData.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to initiate transfer" });
    }
  });
  
  app.post("/api/transfers/:id/pause", async (req, res) => {
    try {
      const { id } = req.params;
      fileTransferManager.pauseTransfer(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to pause transfer" });
    }
  });
  
  app.post("/api/transfers/:id/resume", async (req, res) => {
    try {
      const { id } = req.params;
      fileTransferManager.resumeTransfer(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to resume transfer" });
    }
  });
  
  app.post("/api/transfers/:id/cancel", async (req, res) => {
    try {
      const { id } = req.params;
      fileTransferManager.cancelTransfer(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel transfer" });
    }
  });
  
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = networkAnalytics.getActiveAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });
  
  app.post("/api/alerts/:id/acknowledge", async (req, res) => {
    try {
      const { id } = req.params;
      networkAnalytics.acknowledgeAlert(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to acknowledge alert" });
    }
  });
  
  // Setup event listeners for mesh networking
  meshRouter.on('message:forward', (message, nextHop) => {
    connectionManager.sendToUser(nextHop, {
      type: 'mesh-message',
      message: message
    });
  });
  
  meshRouter.on('message:received', (message) => {
    connectionManager.sendToUser(message.destination, {
      type: 'mesh-message-received',
      message: message
    });
  });
  
  fileTransferManager.on('transfer:started', (request, progress) => {
    connectionManager.sendToUser(request.targetNode, {
      type: 'transfer-started',
      request,
      progress
    });
  });
  
  fileTransferManager.on('transfer:completed', (result) => {
    connectionManager.broadcast({
      type: 'transfer-completed',
      result
    });
  });
  
  networkAnalytics.on('alert:created', (alert) => {
    connectionManager.broadcast({
      type: 'network-alert',
      alert
    });
  });
  
  // Enhanced WebSocket handling with advanced mesh networking
  wss.on('connection', (ws, req) => {
    const userId = req.url?.split('userId=')[1] || Math.random().toString(36);
    connectionManager.addConnection(userId, ws);
    
    // Add node to mesh router
    meshRouter.addNode({
      id: userId,
      address: req.socket.remoteAddress || 'unknown',
      isActive: true,
      connections: [],
      metrics: {
        latency: 0,
        bandwidth: 1000,
        reliability: 1.0
      }
    });
    
    // Record analytics
    networkAnalytics.recordNodeMetrics(userId, {
      isActive: true,
      connectionCount: 1,
      messagesReceived: 0,
      messagesSent: 0,
      latency: 0,
      bandwidth: 1000,
      reliability: 1.0,
      uptime: 100,
      signalStrength: 100
    });
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'offer':
          case 'answer':
          case 'ice-candidate':
            // Enhanced WebRTC signaling with mesh routing
            const routed = meshRouter.routeMessage({
              source: userId,
              destination: data.targetUserId,
              content: data,
              type: 'webrtc-signal',
              ttl: 10
            });
            
            if (!routed) {
              // Fallback to direct connection
              connectionManager.sendToUser(data.targetUserId, {
                ...data,
                fromUserId: userId
              });
            }
            break;
            
          case 'join-room':
            // Notify all users about new node with connection management
            connectionManager.broadcast({
              type: 'user-joined',
              userId: userId,
              nodeMetrics: meshRouter.getNodeMetrics(userId)
            }, userId);
            break;
            
          case 'bluetooth-discovery':
            // Enhanced bluetooth discovery with mesh networking
            const nearbyNodes = meshRouter.getNodes();
            const discoveryData = {
              type: 'bluetooth-discovered',
              nodeId: userId,
              signalStrength: Math.floor(Math.random() * 100),
              nearbyNodes: Array.from(nearbyNodes.keys()).slice(0, 5)
            };
            
            connectionManager.broadcast(discoveryData, userId);
            break;
            
          case 'mesh-message':
            // Handle mesh network messages
            meshRouter.routeMessage({
              source: userId,
              destination: data.destination,
              content: data.content,
              type: 'mesh-message',
              ttl: data.ttl || 10
            });
            break;
            
          case 'file-transfer':
            // Handle file transfer requests
            fileTransferManager.initiateTransfer({
              id: data.transferId,
              fileName: data.fileName,
              fileSize: data.fileSize,
              fileType: data.fileType,
              sourceNode: userId,
              targetNode: data.targetNode,
              priority: data.priority || 'medium',
              resumable: true,
              timestamp: Date.now()
            }).catch(error => {
              console.error('File transfer initiation failed:', error);
              connectionManager.sendToUser(userId, {
                type: 'error',
                message: 'Failed to initiate file transfer'
              });
            });
            break;
            
          case 'ping':
            // Handle ping for connection quality measurement
            const pingStart = Date.now();
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: pingStart,
              nodeId: userId
            }));
            break;
        }
        
        // Update node metrics
        networkAnalytics.recordNodeMetrics(userId, {
          isActive: true,
          connectionCount: 1,
          messagesReceived: 1,
          messagesSent: 0,
          latency: 0,
          bandwidth: 1000,
          reliability: 1.0,
          uptime: 100,
          signalStrength: 100
        });
        
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
        connectionManager.sendToUser(userId, {
          type: 'error',
          message: 'Invalid message format'
        });
      }
    });
    
    ws.on('close', () => {
      meshRouter.removeNode(userId);
      connectionManager.removeConnection(userId);
      
      // Update analytics
      networkAnalytics.recordNodeMetrics(userId, {
        isActive: false,
        connectionCount: 0,
        messagesReceived: 0,
        messagesSent: 0,
        latency: 0,
        bandwidth: 0,
        reliability: 0,
        uptime: 0,
        signalStrength: 0
      });
      
      // Notify other users about disconnection
      connectionManager.broadcast({
        type: 'user-left',
        userId: userId,
        reason: 'disconnected'
      }, userId);
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
    
    // Send initial connection confirmation with enhanced data
    connectionManager.sendToUser(userId, {
      type: 'connected',
      userId: userId,
      nodeInfo: {
        id: userId,
        capabilities: ['webrtc', 'bluetooth', 'file-transfer'],
        networkStats: meshRouter.getNetworkStats()
      }
    });
  });
  
  return httpServer;
}
