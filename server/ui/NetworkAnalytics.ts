import { EventEmitter } from 'events';

export interface NetworkMetrics {
  timestamp: number;
  totalNodes: number;
  activeNodes: number;
  totalConnections: number;
  messagesPerSecond: number;
  averageLatency: number;
  packetLoss: number;
  bandwidth: number;
  networkHealth: 'excellent' | 'good' | 'degraded' | 'critical';
}

export interface NodeMetrics {
  nodeId: string;
  timestamp: number;
  isActive: boolean;
  connectionCount: number;
  messagesReceived: number;
  messagesSent: number;
  latency: number;
  bandwidth: number;
  reliability: number;
  uptime: number;
  batteryLevel?: number;
  signalStrength: number;
}

export interface ConnectionMetrics {
  connectionId: string;
  nodeA: string;
  nodeB: string;
  timestamp: number;
  latency: number;
  bandwidth: number;
  packetLoss: number;
  reliability: number;
  connectionType: 'bluetooth' | 'webrtc' | 'wifi';
  isActive: boolean;
}

export interface AlertCondition {
  id: string;
  type: 'node_down' | 'high_latency' | 'packet_loss' | 'low_bandwidth' | 'security_breach';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  callback?: (alert: NetworkAlert) => void;
}

export interface NetworkAlert {
  id: string;
  type: AlertCondition['type'];
  severity: AlertCondition['severity'];
  message: string;
  nodeId?: string;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
}

export interface AnalyticsReport {
  period: 'hour' | 'day' | 'week' | 'month';
  startTime: number;
  endTime: number;
  metrics: {
    averageNodes: number;
    totalMessages: number;
    averageLatency: number;
    uptimePercentage: number;
    topPerformingNodes: string[];
    networkEfficiency: number;
  };
  trends: {
    nodeGrowth: number;
    performanceChange: number;
    reliabilityTrend: number;
  };
  alerts: NetworkAlert[];
}

/**
 * Comprehensive network analytics and monitoring system
 * Tracks performance, generates reports, and provides alerting
 */
export class NetworkAnalytics extends EventEmitter {
  private networkMetrics: NetworkMetrics[] = [];
  private nodeMetrics = new Map<string, NodeMetrics[]>();
  private connectionMetrics = new Map<string, ConnectionMetrics[]>();
  private alertConditions = new Map<string, AlertCondition>();
  private activeAlerts = new Map<string, NetworkAlert>();
  
  private metricsInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private maxHistorySize = 1000;
  private metricsUpdateInterval = 5000; // 5 seconds
  private cleanupInterval_ms = 60000; // 1 minute
  private dataRetentionPeriod = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    super();
    this.setupDefaultAlerts();
    this.startMetricsCollection();
  }

  /**
   * Record network-wide metrics
   */
  recordNetworkMetrics(metrics: Omit<NetworkMetrics, 'timestamp'>): void {
    const networkMetrics: NetworkMetrics = {
      ...metrics,
      timestamp: Date.now()
    };
    
    this.networkMetrics.push(networkMetrics);
    
    // Limit history size
    if (this.networkMetrics.length > this.maxHistorySize) {
      this.networkMetrics.shift();
    }
    
    this.checkNetworkAlerts(networkMetrics);
    this.emit('metrics:network', networkMetrics);
  }

  /**
   * Record node-specific metrics
   */
  recordNodeMetrics(nodeId: string, metrics: Omit<NodeMetrics, 'nodeId' | 'timestamp'>): void {
    const nodeMetrics: NodeMetrics = {
      nodeId,
      timestamp: Date.now(),
      ...metrics
    };
    
    let nodeHistory = this.nodeMetrics.get(nodeId);
    if (!nodeHistory) {
      nodeHistory = [];
      this.nodeMetrics.set(nodeId, nodeHistory);
    }
    
    nodeHistory.push(nodeMetrics);
    
    // Limit history size
    if (nodeHistory.length > this.maxHistorySize) {
      nodeHistory.shift();
    }
    
    this.checkNodeAlerts(nodeMetrics);
    this.emit('metrics:node', nodeMetrics);
  }

  /**
   * Record connection metrics
   */
  recordConnectionMetrics(connectionId: string, metrics: Omit<ConnectionMetrics, 'connectionId' | 'timestamp'>): void {
    const connectionMetrics: ConnectionMetrics = {
      connectionId,
      timestamp: Date.now(),
      ...metrics
    };
    
    let connectionHistory = this.connectionMetrics.get(connectionId);
    if (!connectionHistory) {
      connectionHistory = [];
      this.connectionMetrics.set(connectionId, connectionHistory);
    }
    
    connectionHistory.push(connectionMetrics);
    
    // Limit history size
    if (connectionHistory.length > this.maxHistorySize) {
      connectionHistory.shift();
    }
    
    this.checkConnectionAlerts(connectionMetrics);
    this.emit('metrics:connection', connectionMetrics);
  }

  /**
   * Get current network status
   */
  getCurrentNetworkStatus(): NetworkMetrics | null {
    return this.networkMetrics.length > 0 ? this.networkMetrics[this.networkMetrics.length - 1] : null;
  }

  /**
   * Get node metrics history
   */
  getNodeMetrics(nodeId: string, limit?: number): NodeMetrics[] {
    const metrics = this.nodeMetrics.get(nodeId) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Get connection metrics history
   */
  getConnectionMetrics(connectionId: string, limit?: number): ConnectionMetrics[] {
    const metrics = this.connectionMetrics.get(connectionId) || [];
    return limit ? metrics.slice(-limit) : metrics;
  }

  /**
   * Get network metrics history
   */
  getNetworkMetrics(limit?: number): NetworkMetrics[] {
    return limit ? this.networkMetrics.slice(-limit) : this.networkMetrics;
  }

  /**
   * Generate analytics report
   */
  generateReport(period: AnalyticsReport['period']): AnalyticsReport {
    const now = Date.now();
    let startTime: number;
    
    switch (period) {
      case 'hour':
        startTime = now - (60 * 60 * 1000);
        break;
      case 'day':
        startTime = now - (24 * 60 * 60 * 1000);
        break;
      case 'week':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    const filteredMetrics = this.networkMetrics.filter(m => m.timestamp >= startTime);
    
    const report: AnalyticsReport = {
      period,
      startTime,
      endTime: now,
      metrics: this.calculateReportMetrics(filteredMetrics),
      trends: this.calculateTrends(filteredMetrics),
      alerts: Array.from(this.activeAlerts.values()).filter(a => a.timestamp >= startTime)
    };
    
    return report;
  }

  /**
   * Add alert condition
   */
  addAlertCondition(condition: AlertCondition): void {
    this.alertConditions.set(condition.id, condition);
  }

  /**
   * Remove alert condition
   */
  removeAlertCondition(conditionId: string): void {
    this.alertConditions.delete(conditionId);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): NetworkAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alert:acknowledged', alert);
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolved = true;
      this.activeAlerts.delete(alertId);
      this.emit('alert:resolved', alert);
    }
  }

  /**
   * Calculate network health score
   */
  calculateNetworkHealth(): 'excellent' | 'good' | 'degraded' | 'critical' {
    const currentMetrics = this.getCurrentNetworkStatus();
    if (!currentMetrics) return 'critical';
    
    const recentMetrics = this.networkMetrics.slice(-10);
    const avgLatency = recentMetrics.reduce((sum, m) => sum + m.averageLatency, 0) / recentMetrics.length;
    const avgPacketLoss = recentMetrics.reduce((sum, m) => sum + m.packetLoss, 0) / recentMetrics.length;
    const uptime = (currentMetrics.activeNodes / currentMetrics.totalNodes) * 100;
    
    if (avgLatency < 100 && avgPacketLoss < 1 && uptime > 95) return 'excellent';
    if (avgLatency < 300 && avgPacketLoss < 5 && uptime > 90) return 'good';
    if (avgLatency < 1000 && avgPacketLoss < 10 && uptime > 80) return 'degraded';
    return 'critical';
  }

  /**
   * Get top performing nodes
   */
  getTopPerformingNodes(limit: number = 10): Array<{ nodeId: string; score: number }> {
    const nodeScores: Array<{ nodeId: string; score: number }> = [];
    
    this.nodeMetrics.forEach((metrics, nodeId) => {
      const recentMetrics = metrics.slice(-10);
      if (recentMetrics.length === 0) return;
      
      const avgLatency = recentMetrics.reduce((sum, m) => sum + m.latency, 0) / recentMetrics.length;
      const avgReliability = recentMetrics.reduce((sum, m) => sum + m.reliability, 0) / recentMetrics.length;
      const avgUptime = recentMetrics.reduce((sum, m) => sum + m.uptime, 0) / recentMetrics.length;
      
      // Calculate performance score (0-100)
      const latencyScore = Math.max(0, 100 - (avgLatency / 10));
      const reliabilityScore = avgReliability * 100;
      const uptimeScore = (avgUptime / 100) * 100;
      
      const totalScore = (latencyScore + reliabilityScore + uptimeScore) / 3;
      nodeScores.push({ nodeId, score: totalScore });
    });
    
    return nodeScores.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Setup default alert conditions
   */
  private setupDefaultAlerts(): void {
    this.addAlertCondition({
      id: 'high_latency',
      type: 'high_latency',
      threshold: 1000, // 1 second
      severity: 'medium',
      enabled: true
    });
    
    this.addAlertCondition({
      id: 'packet_loss',
      type: 'packet_loss',
      threshold: 5, // 5%
      severity: 'high',
      enabled: true
    });
    
    this.addAlertCondition({
      id: 'low_bandwidth',
      type: 'low_bandwidth',
      threshold: 1024, // 1KB/s
      severity: 'medium',
      enabled: true
    });
  }

  /**
   * Check for network-level alerts
   */
  private checkNetworkAlerts(metrics: NetworkMetrics): void {
    this.alertConditions.forEach((condition) => {
      if (!condition.enabled) return;
      
      let triggered = false;
      let message = '';
      
      switch (condition.type) {
        case 'high_latency':
          if (metrics.averageLatency > condition.threshold) {
            triggered = true;
            message = `Network latency is ${metrics.averageLatency}ms (threshold: ${condition.threshold}ms)`;
          }
          break;
        case 'packet_loss':
          if (metrics.packetLoss > condition.threshold) {
            triggered = true;
            message = `Network packet loss is ${metrics.packetLoss}% (threshold: ${condition.threshold}%)`;
          }
          break;
        case 'low_bandwidth':
          if (metrics.bandwidth < condition.threshold) {
            triggered = true;
            message = `Network bandwidth is ${metrics.bandwidth} KB/s (threshold: ${condition.threshold} KB/s)`;
          }
          break;
      }
      
      if (triggered) {
        this.createAlert(condition, message);
      }
    });
  }

  /**
   * Check for node-level alerts
   */
  private checkNodeAlerts(metrics: NodeMetrics): void {
    this.alertConditions.forEach((condition) => {
      if (!condition.enabled) return;
      
      let triggered = false;
      let message = '';
      
      switch (condition.type) {
        case 'node_down':
          if (!metrics.isActive) {
            triggered = true;
            message = `Node ${metrics.nodeId} is down`;
          }
          break;
        case 'high_latency':
          if (metrics.latency > condition.threshold) {
            triggered = true;
            message = `Node ${metrics.nodeId} latency is ${metrics.latency}ms (threshold: ${condition.threshold}ms)`;
          }
          break;
      }
      
      if (triggered) {
        this.createAlert(condition, message, metrics.nodeId);
      }
    });
  }

  /**
   * Check for connection-level alerts
   */
  private checkConnectionAlerts(metrics: ConnectionMetrics): void {
    this.alertConditions.forEach((condition) => {
      if (!condition.enabled) return;
      
      let triggered = false;
      let message = '';
      
      switch (condition.type) {
        case 'high_latency':
          if (metrics.latency > condition.threshold) {
            triggered = true;
            message = `Connection ${metrics.connectionId} latency is ${metrics.latency}ms`;
          }
          break;
        case 'packet_loss':
          if (metrics.packetLoss > condition.threshold) {
            triggered = true;
            message = `Connection ${metrics.connectionId} packet loss is ${metrics.packetLoss}%`;
          }
          break;
      }
      
      if (triggered) {
        this.createAlert(condition, message);
      }
    });
  }

  /**
   * Create a new alert
   */
  private createAlert(condition: AlertCondition, message: string, nodeId?: string): void {
    const alertId = `${condition.id}-${Date.now()}`;
    
    const alert: NetworkAlert = {
      id: alertId,
      type: condition.type,
      severity: condition.severity,
      message,
      nodeId,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false
    };
    
    this.activeAlerts.set(alertId, alert);
    this.emit('alert:created', alert);
    
    if (condition.callback) {
      condition.callback(alert);
    }
  }

  /**
   * Calculate report metrics
   */
  private calculateReportMetrics(metrics: NetworkMetrics[]): AnalyticsReport['metrics'] {
    if (metrics.length === 0) {
      return {
        averageNodes: 0,
        totalMessages: 0,
        averageLatency: 0,
        uptimePercentage: 0,
        topPerformingNodes: [],
        networkEfficiency: 0
      };
    }
    
    const avgNodes = metrics.reduce((sum, m) => sum + m.activeNodes, 0) / metrics.length;
    const totalMessages = metrics.reduce((sum, m) => sum + m.messagesPerSecond, 0);
    const avgLatency = metrics.reduce((sum, m) => sum + m.averageLatency, 0) / metrics.length;
    const uptimePercentage = (metrics.filter(m => m.networkHealth !== 'critical').length / metrics.length) * 100;
    
    return {
      averageNodes: Math.round(avgNodes),
      totalMessages: Math.round(totalMessages),
      averageLatency: Math.round(avgLatency),
      uptimePercentage: Math.round(uptimePercentage),
      topPerformingNodes: this.getTopPerformingNodes(5).map(n => n.nodeId),
      networkEfficiency: this.calculateNetworkEfficiency(metrics)
    };
  }

  /**
   * Calculate network efficiency
   */
  private calculateNetworkEfficiency(metrics: NetworkMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    const avgLatency = metrics.reduce((sum, m) => sum + m.averageLatency, 0) / metrics.length;
    const avgPacketLoss = metrics.reduce((sum, m) => sum + m.packetLoss, 0) / metrics.length;
    const avgBandwidth = metrics.reduce((sum, m) => sum + m.bandwidth, 0) / metrics.length;
    
    // Efficiency score (0-100)
    const latencyScore = Math.max(0, 100 - (avgLatency / 10));
    const lossScore = Math.max(0, 100 - avgPacketLoss);
    const bandwidthScore = Math.min(100, avgBandwidth / 10);
    
    return Math.round((latencyScore + lossScore + bandwidthScore) / 3);
  }

  /**
   * Calculate trends
   */
  private calculateTrends(metrics: NetworkMetrics[]): AnalyticsReport['trends'] {
    if (metrics.length < 2) {
      return {
        nodeGrowth: 0,
        performanceChange: 0,
        reliabilityTrend: 0
      };
    }
    
    const first = metrics[0];
    const last = metrics[metrics.length - 1];
    
    const nodeGrowth = ((last.activeNodes - first.activeNodes) / first.activeNodes) * 100;
    const performanceChange = ((first.averageLatency - last.averageLatency) / first.averageLatency) * 100;
    const reliabilityTrend = ((last.packetLoss - first.packetLoss) / Math.max(first.packetLoss, 1)) * -100;
    
    return {
      nodeGrowth: Math.round(nodeGrowth),
      performanceChange: Math.round(performanceChange),
      reliabilityTrend: Math.round(reliabilityTrend)
    };
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.emit('metrics:collect');
    }, this.metricsUpdateInterval);
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, this.cleanupInterval_ms);
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const cutoff = Date.now() - this.dataRetentionPeriod;
    
    this.networkMetrics = this.networkMetrics.filter(m => m.timestamp > cutoff);
    
    this.nodeMetrics.forEach((metrics, nodeId) => {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      if (filtered.length === 0) {
        this.nodeMetrics.delete(nodeId);
      } else {
        this.nodeMetrics.set(nodeId, filtered);
      }
    });
    
    this.connectionMetrics.forEach((metrics, connectionId) => {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      if (filtered.length === 0) {
        this.connectionMetrics.delete(connectionId);
      } else {
        this.connectionMetrics.set(connectionId, filtered);
      }
    });
  }

  /**
   * Destroy and clean up
   */
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.networkMetrics.length = 0;
    this.nodeMetrics.clear();
    this.connectionMetrics.clear();
    this.alertConditions.clear();
    this.activeAlerts.clear();
  }
}