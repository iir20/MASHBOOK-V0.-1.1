import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

interface ConnectionInfo {
  ws: WebSocket;
  userId: string;
  lastPing: number;
  connectionTime: number;
  isHealthy: boolean;
}

interface ConnectionMetrics {
  latency: number;
  bandwidth: number;
  packetLoss: number;
  quality: 'excellent' | 'good' | 'poor' | 'critical';
}

export class ConnectionManager extends EventEmitter {
  private connections = new Map<string, ConnectionInfo>();
  private metrics = new Map<string, ConnectionMetrics>();
  private pingInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startHealthChecks();
  }

  addConnection(userId: string, ws: WebSocket) {
    const connectionInfo: ConnectionInfo = {
      ws,
      userId,
      lastPing: Date.now(),
      connectionTime: Date.now(),
      isHealthy: true
    };

    this.connections.set(userId, connectionInfo);
    this.initializeMetrics(userId);
    this.setupConnectionHandlers(userId, ws);
    
    this.emit('connection:added', userId);
    console.log(`Connection added: ${userId} (Total: ${this.connections.size})`);
  }

  removeConnection(userId: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      this.connections.delete(userId);
      this.metrics.delete(userId);
      this.emit('connection:removed', userId);
      console.log(`Connection removed: ${userId} (Total: ${this.connections.size})`);
    }
  }

  sendToUser(userId: string, message: any): boolean {
    const connection = this.connections.get(userId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      try {
        connection.ws.send(JSON.stringify(message));
        this.updateBandwidthMetrics(userId, JSON.stringify(message).length);
        return true;
      } catch (error) {
        console.error(`Failed to send message to ${userId}:`, error);
        this.markConnectionUnhealthy(userId);
        return false;
      }
    }
    return false;
  }

  broadcast(message: any, excludeUserId?: string) {
    const payload = JSON.stringify(message);
    let successCount = 0;
    
    this.connections.forEach((connection, userId) => {
      if (userId !== excludeUserId && connection.ws.readyState === WebSocket.OPEN) {
        try {
          connection.ws.send(payload);
          this.updateBandwidthMetrics(userId, payload.length);
          successCount++;
        } catch (error) {
          console.error(`Failed to broadcast to ${userId}:`, error);
          this.markConnectionUnhealthy(userId);
        }
      }
    });
    
    return successCount;
  }

  getConnection(userId: string): ConnectionInfo | undefined {
    return this.connections.get(userId);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connections.keys());
  }

  getConnectionMetrics(userId: string): ConnectionMetrics | undefined {
    return this.metrics.get(userId);
  }

  getAllMetrics(): Map<string, ConnectionMetrics> {
    return new Map(this.metrics);
  }

  private initializeMetrics(userId: string) {
    this.metrics.set(userId, {
      latency: 0,
      bandwidth: 0,
      packetLoss: 0,
      quality: 'excellent'
    });
  }

  private setupConnectionHandlers(userId: string, ws: WebSocket) {
    ws.on('pong', () => {
      const connection = this.connections.get(userId);
      if (connection) {
        const latency = Date.now() - connection.lastPing;
        connection.lastPing = Date.now();
        connection.isHealthy = true;
        this.updateLatencyMetrics(userId, latency);
      }
    });

    ws.on('close', () => {
      this.removeConnection(userId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${userId}:`, error);
      this.markConnectionUnhealthy(userId);
    });
  }

  private startHealthChecks() {
    // Ping connections every 30 seconds
    this.pingInterval = setInterval(() => {
      this.pingConnections();
    }, 30000);

    // Health check every 60 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000);
  }

  private pingConnections() {
    this.connections.forEach((connection, userId) => {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.lastPing = Date.now();
        connection.ws.ping();
      } else {
        this.removeConnection(userId);
      }
    });
  }

  private performHealthCheck() {
    const now = Date.now();
    const unhealthyConnections: string[] = [];

    this.connections.forEach((connection, userId) => {
      // Mark as unhealthy if no pong received in 90 seconds
      if (now - connection.lastPing > 90000) {
        connection.isHealthy = false;
        unhealthyConnections.push(userId);
      }
    });

    // Remove unhealthy connections
    unhealthyConnections.forEach(userId => {
      this.removeConnection(userId);
    });

    this.emit('health:check', {
      healthy: this.connections.size - unhealthyConnections.length,
      unhealthy: unhealthyConnections.length
    });
  }

  private updateLatencyMetrics(userId: string, latency: number) {
    const metrics = this.metrics.get(userId);
    if (metrics) {
      metrics.latency = latency;
      metrics.quality = this.calculateQuality(metrics);
      this.metrics.set(userId, metrics);
    }
  }

  private updateBandwidthMetrics(userId: string, bytes: number) {
    const metrics = this.metrics.get(userId);
    if (metrics) {
      // Simple bandwidth calculation (bytes per second)
      metrics.bandwidth = bytes / 1024; // KB/s
      this.metrics.set(userId, metrics);
    }
  }

  private calculateQuality(metrics: ConnectionMetrics): 'excellent' | 'good' | 'poor' | 'critical' {
    if (metrics.latency < 100 && metrics.packetLoss < 1) return 'excellent';
    if (metrics.latency < 300 && metrics.packetLoss < 5) return 'good';
    if (metrics.latency < 1000 && metrics.packetLoss < 10) return 'poor';
    return 'critical';
  }

  private markConnectionUnhealthy(userId: string) {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.isHealthy = false;
      const metrics = this.metrics.get(userId);
      if (metrics) {
        metrics.packetLoss += 1;
        metrics.quality = this.calculateQuality(metrics);
        this.metrics.set(userId, metrics);
      }
    }
  }

  destroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.connections.clear();
    this.metrics.clear();
  }
}