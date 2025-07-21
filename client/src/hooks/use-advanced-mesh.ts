import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface AdvancedMeshMetrics {
  networkStats: {
    totalNodes: number;
    activeRoutes: number;
    averageLatency: number;
    networkReliability: number;
  };
  connectionMetrics: Array<[string, {
    latency: number;
    bandwidth: number;
    packetLoss: number;
    quality: 'excellent' | 'good' | 'poor' | 'critical';
  }]>;
  currentStatus: {
    totalNodes: number;
    activeNodes: number;
    totalConnections: number;
    messagesPerSecond: number;
    averageLatency: number;
    packetLoss: number;
    bandwidth: number;
    networkHealth: 'excellent' | 'good' | 'degraded' | 'critical';
  } | null;
}

export interface NetworkAlert {
  id: string;
  type: 'node_down' | 'high_latency' | 'packet_loss' | 'low_bandwidth' | 'security_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  nodeId?: string;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
}

export interface FileTransferStatus {
  activeTransfers: Array<{
    transferId: string;
    fileName: string;
    totalSize: number;
    transferredSize: number;
    progress: number;
    speed: number;
    eta: number;
    status: 'pending' | 'transferring' | 'paused' | 'completed' | 'failed' | 'cancelled';
  }>;
  statistics: {
    totalTransfers: number;
    completedTransfers: number;
    failedTransfers: number;
    totalBytesTransferred: number;
    averageSpeed: number;
    activeTransfers: number;
  };
}

export interface MeshConnection {
  userId: string;
  ws: WebSocket | null;
  isConnected: boolean;
  connectionAttempts: number;
  lastConnectionTime: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
  metrics: {
    latency: number;
    bandwidth: number;
    reliability: number;
  };
}

export function useAdvancedMesh(nodeId: string) {
  const [connection, setConnection] = useState<MeshConnection>({
    userId: nodeId,
    ws: null,
    isConnected: false,
    connectionAttempts: 0,
    lastConnectionTime: 0,
    connectionQuality: 'excellent',
    metrics: {
      latency: 0,
      bandwidth: 0,
      reliability: 1.0
    }
  });
  
  const [messages, setMessages] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<NetworkAlert[]>([]);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const connectionRef = useRef<MeshConnection>(connection);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch network metrics
  const { data: networkMetrics, refetch: refetchNetworkMetrics } = useQuery({
    queryKey: ['/api/network/status'],
    queryFn: async () => {
      const response = await fetch('/api/network/status');
      return response.json() as Promise<AdvancedMeshMetrics>;
    },
    refetchInterval: 5000,
    retry: 3
  });
  
  // Fetch alerts
  const { data: networkAlerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/alerts');
      return response.json() as Promise<NetworkAlert[]>;
    },
    refetchInterval: 10000,
    retry: 2
  });
  
  // Fetch file transfer status
  const { data: transferStatus, refetch: refetchTransfers } = useQuery({
    queryKey: ['/api/transfers/status'],
    queryFn: async () => {
      const response = await fetch('/api/transfers/status');
      return response.json() as Promise<FileTransferStatus>;
    },
    refetchInterval: 2000,
    retry: 2
  });
  
  // Fetch network analytics
  const { data: networkAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['/api/network/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/network/analytics?period=hour');
      return response.json();
    },
    refetchInterval: 30000,
    retry: 2
  });
  
  // Enhanced connection management with throttling
  const connect = useCallback(() => {
    if (connectionRef.current.ws?.readyState === WebSocket.OPEN) {
      return;
    }
    
    // Prevent rapid reconnections
    const now = Date.now();
    if (now - connectionRef.current.lastConnectionTime < 2000) {
      return;
    }
    
    // Mark connection attempt
    connectionRef.current.lastConnectionTime = now;
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws?userId=${nodeId}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('Advanced mesh connection established');
        const newConnection: MeshConnection = {
          ...connectionRef.current,
          ws,
          isConnected: true,
          lastConnectionTime: Date.now(),
          connectionAttempts: 0,
          connectionQuality: 'excellent'
        };
        
        setConnection(newConnection);
        connectionRef.current = newConnection;
        
        // Send join-room message
        ws.send(JSON.stringify({ type: 'join-room' }));
        
        // Process pending messages
        processPendingMessages();
        
        // Start ping interval
        startPingInterval();
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('Advanced mesh connection closed');
        const updatedConnection = {
          ...connectionRef.current,
          ws: null,
          isConnected: false,
          connectionQuality: 'critical' as const
        };
        setConnection(updatedConnection);
        connectionRef.current = updatedConnection;
        
        clearPingInterval();
        
        // Only schedule reconnect if we're not already trying
        if (!reconnectTimeoutRef.current) {
          scheduleReconnect();
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnection(prev => ({
          ...prev,
          connectionAttempts: prev.connectionAttempts + 1,
          connectionQuality: 'poor'
        }));
      };
      
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      scheduleReconnect();
    }
  }, [nodeId]);
  
  // Handle incoming messages
  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'connected':
        console.log('Connected to advanced mesh network:', message.nodeInfo);
        break;
        
      case 'user-joined':
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          type: 'system',
          content: `${message.userId} joined the network`,
          timestamp: new Date(),
          nodeMetrics: message.nodeMetrics
        }]);
        break;
        
      case 'user-left':
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          type: 'system',
          content: `${message.userId} left the network`,
          timestamp: new Date(),
          reason: message.reason
        }]);
        break;
        
      case 'mesh-message':
        setMessages(prev => [...prev, {
          id: message.message.id,
          type: 'mesh',
          content: message.message.content,
          timestamp: new Date(message.message.timestamp),
          source: message.message.source,
          hopCount: message.message.hopCount,
          route: message.message.route
        }]);
        break;
        
      case 'network-alert':
        setAlerts(prev => [...prev, message.alert]);
        break;
        
      case 'transfer-started':
        console.log('File transfer started:', message.request);
        break;
        
      case 'transfer-completed':
        console.log('File transfer completed:', message.result);
        break;
        
      case 'bluetooth-discovered':
        setMessages(prev => [...prev, {
          id: `bluetooth-${Date.now()}`,
          type: 'bluetooth',
          content: `Bluetooth node discovered: ${message.nodeId}`,
          timestamp: new Date(),
          signalStrength: message.signalStrength,
          nearbyNodes: message.nearbyNodes
        }]);
        break;
        
      case 'pong':
        // Update connection metrics
        const latency = Date.now() - message.timestamp;
        setConnection(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            latency
          },
          connectionQuality: latency < 100 ? 'excellent' : 
                            latency < 300 ? 'good' :
                            latency < 1000 ? 'poor' : 'critical'
        }));
        break;
        
      case 'error':
        console.error('Server error:', message.message);
        break;
    }
  }, []);
  
  // Process pending messages when connection is restored
  const processPendingMessages = useCallback(() => {
    if (connectionRef.current.ws?.readyState === WebSocket.OPEN) {
      pendingMessages.forEach(message => {
        connectionRef.current.ws?.send(JSON.stringify(message));
      });
      setPendingMessages([]);
    }
  }, [pendingMessages]);
  
  // Schedule reconnection with exponential backoff
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    const attempts = connectionRef.current.connectionAttempts;
    const delay = Math.min(5000 * Math.pow(1.5, attempts), 30000); // Start at 5 seconds, max 30 seconds
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!connectionRef.current.isConnected) {
        reconnectTimeoutRef.current = null;
        connect();
      }
    }, delay);
  }, [connect]);
  
  // Start ping interval for connection health monitoring
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    pingIntervalRef.current = setInterval(() => {
      if (connectionRef.current.ws?.readyState === WebSocket.OPEN) {
        connectionRef.current.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000); // Ping every 30 seconds
  }, []);
  
  // Clear ping interval
  const clearPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);
  
  // Send message with queue support
  const sendMessage = useCallback((message: any) => {
    if (connectionRef.current.ws?.readyState === WebSocket.OPEN) {
      connectionRef.current.ws.send(JSON.stringify(message));
    } else {
      setPendingMessages(prev => [...prev, message]);
    }
  }, []);
  
  // Send mesh message
  const sendMeshMessage = useCallback((destination: string, content: any, ttl: number = 10) => {
    sendMessage({
      type: 'mesh-message',
      destination,
      content,
      ttl
    });
  }, [sendMessage]);
  
  // Initiate file transfer
  const initiateFileTransfer = useCallback(async (fileName: string, fileSize: number, targetNode: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') => {
    try {
      const response = await fetch('/api/transfers/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileSize,
          fileType: fileName.split('.').pop() || 'unknown',
          targetNode,
          priority,
          sourceNode: nodeId,
          resumable: true
        })
      });
      
      const result = await response.json();
      return result.transferId;
    } catch (error) {
      console.error('Failed to initiate file transfer:', error);
      throw error;
    }
  }, [nodeId]);
  
  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }, []);
  
  // Start health check interval
  const startHealthCheck = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }
    
    healthCheckIntervalRef.current = setInterval(() => {
      // Refetch data periodically
      refetchNetworkMetrics();
      refetchAlerts();
      refetchTransfers();
    }, 10000); // Every 10 seconds
  }, [refetchNetworkMetrics, refetchAlerts, refetchTransfers]);
  
  // Initialize connection
  useEffect(() => {
    connect();
    startHealthCheck();
    
    return () => {
      if (connectionRef.current.ws) {
        connectionRef.current.ws.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      clearPingInterval();
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [connect, startHealthCheck, clearPingInterval]);
  
  // Update connection ref when connection changes
  useEffect(() => {
    connectionRef.current = connection;
  }, [connection]);
  
  return {
    // Connection status
    isConnected: connection.isConnected,
    connectionQuality: connection.connectionQuality,
    connectionMetrics: connection.metrics,
    
    // Network data
    networkMetrics,
    networkAlerts: networkAlerts || [],
    transferStatus,
    networkAnalytics,
    
    // Messages and alerts
    messages,
    alerts,
    
    // Actions
    sendMessage,
    sendMeshMessage,
    initiateFileTransfer,
    acknowledgeAlert,
    
    // Manual controls
    connect,
    disconnect: () => {
      if (connectionRef.current.ws) {
        connectionRef.current.ws.close();
      }
    },
    
    // Utility functions
    refetchNetworkMetrics,
    refetchAlerts,
    refetchTransfers,
    refetchAnalytics
  };
}