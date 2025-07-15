import { EventEmitter } from 'events';

export interface MeshNode {
  id: string;
  address: string;
  isActive: boolean;
  lastSeen: number;
  connections: string[];
  metrics: {
    latency: number;
    bandwidth: number;
    reliability: number;
  };
}

export interface MeshRoute {
  destination: string;
  nextHop: string;
  hopCount: number;
  cost: number;
  lastUpdate: number;
  isActive: boolean;
}

export interface MeshMessage {
  id: string;
  source: string;
  destination: string;
  content: any;
  type: string;
  ttl: number;
  hopCount: number;
  route: string[];
  timestamp: number;
}

/**
 * Advanced mesh routing with Dijkstra's algorithm for optimal path finding
 * and dynamic route adaptation based on network conditions
 */
export class MeshRouter extends EventEmitter {
  private nodes = new Map<string, MeshNode>();
  private routingTable = new Map<string, MeshRoute>();
  private messageBuffer = new Map<string, MeshMessage>();
  private routingUpdateInterval: NodeJS.Timeout | null = null;
  private nodeCleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(private nodeId: string) {
    super();
    this.startPeriodicUpdates();
  }

  /**
   * Add or update a mesh node
   */
  addNode(node: Omit<MeshNode, 'lastSeen'>): void {
    const existingNode = this.nodes.get(node.id);
    const updatedNode: MeshNode = {
      ...node,
      lastSeen: Date.now(),
      connections: existingNode?.connections || []
    };
    
    this.nodes.set(node.id, updatedNode);
    this.emit('node:added', updatedNode);
    
    // Trigger route recalculation
    this.calculateOptimalRoutes();
  }

  /**
   * Remove a mesh node and update routing table
   */
  removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.nodes.delete(nodeId);
      this.removeRoutesToNode(nodeId);
      this.emit('node:removed', node);
      this.calculateOptimalRoutes();
    }
  }

  /**
   * Add connection between two nodes
   */
  addConnection(nodeA: string, nodeB: string): void {
    const nodeAObj = this.nodes.get(nodeA);
    const nodeBObj = this.nodes.get(nodeB);
    
    if (nodeAObj && nodeBObj) {
      if (!nodeAObj.connections.includes(nodeB)) {
        nodeAObj.connections.push(nodeB);
      }
      if (!nodeBObj.connections.includes(nodeA)) {
        nodeBObj.connections.push(nodeA);
      }
      
      this.emit('connection:added', { nodeA, nodeB });
      this.calculateOptimalRoutes();
    }
  }

  /**
   * Remove connection between two nodes
   */
  removeConnection(nodeA: string, nodeB: string): void {
    const nodeAObj = this.nodes.get(nodeA);
    const nodeBObj = this.nodes.get(nodeB);
    
    if (nodeAObj) {
      nodeAObj.connections = nodeAObj.connections.filter(id => id !== nodeB);
    }
    if (nodeBObj) {
      nodeBObj.connections = nodeBObj.connections.filter(id => id !== nodeA);
    }
    
    this.emit('connection:removed', { nodeA, nodeB });
    this.calculateOptimalRoutes();
  }

  /**
   * Route a message through the mesh network
   */
  routeMessage(message: Omit<MeshMessage, 'id' | 'timestamp' | 'hopCount' | 'route'>): boolean {
    const meshMessage: MeshMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
      hopCount: 0,
      route: [this.nodeId]
    };

    // Check if message is for this node
    if (message.destination === this.nodeId) {
      this.emit('message:received', meshMessage);
      return true;
    }

    // Find optimal route
    const route = this.routingTable.get(message.destination);
    if (!route || !route.isActive) {
      // Try to find alternative route
      const alternativeRoute = this.findAlternativeRoute(message.destination);
      if (!alternativeRoute) {
        this.emit('message:failed', meshMessage, 'No route found');
        return false;
      }
      
      // Update routing table with new route
      this.routingTable.set(message.destination, alternativeRoute);
    }

    // Forward message to next hop
    const nextHop = route?.nextHop || this.routingTable.get(message.destination)?.nextHop;
    if (nextHop) {
      meshMessage.hopCount++;
      meshMessage.route.push(nextHop);
      
      if (meshMessage.hopCount > meshMessage.ttl) {
        this.emit('message:expired', meshMessage);
        return false;
      }
      
      this.emit('message:forward', meshMessage, nextHop);
      return true;
    }

    return false;
  }

  /**
   * Calculate optimal routes using Dijkstra's algorithm
   */
  private calculateOptimalRoutes(): void {
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const unvisited = new Set<string>();

    // Initialize distances
    this.nodes.forEach((_, nodeId) => {
      distances.set(nodeId, nodeId === this.nodeId ? 0 : Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    });

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentNode: string | null = null;
      let minDistance = Infinity;
      
      for (const nodeId of unvisited) {
        const distance = distances.get(nodeId) || Infinity;
        if (distance < minDistance) {
          minDistance = distance;
          currentNode = nodeId;
        }
      }

      if (!currentNode || minDistance === Infinity) break;

      unvisited.delete(currentNode);
      const currentDistance = distances.get(currentNode) || 0;

      // Update distances to neighbors
      const currentNodeObj = this.nodes.get(currentNode);
      if (currentNodeObj) {
        for (const neighborId of currentNodeObj.connections) {
          if (unvisited.has(neighborId)) {
            const neighborNode = this.nodes.get(neighborId);
            if (neighborNode) {
              const edgeCost = this.calculateEdgeCost(currentNode, neighborId);
              const newDistance = currentDistance + edgeCost;
              
              if (newDistance < (distances.get(neighborId) || Infinity)) {
                distances.set(neighborId, newDistance);
                previous.set(neighborId, currentNode);
              }
            }
          }
        }
      }
    }

    // Build routing table
    this.buildRoutingTable(distances, previous);
  }

  /**
   * Calculate edge cost between two nodes based on metrics
   */
  private calculateEdgeCost(nodeA: string, nodeB: string): number {
    const nodeAObj = this.nodes.get(nodeA);
    const nodeBObj = this.nodes.get(nodeB);
    
    if (!nodeAObj || !nodeBObj) return Infinity;

    // Cost based on latency, bandwidth, and reliability
    const latencyCost = nodeAObj.metrics.latency + nodeBObj.metrics.latency;
    const bandwidthCost = 1000 / Math.max(nodeAObj.metrics.bandwidth, nodeBObj.metrics.bandwidth, 1);
    const reliabilityCost = (2 - nodeAObj.metrics.reliability - nodeBObj.metrics.reliability) * 100;
    
    return latencyCost + bandwidthCost + reliabilityCost;
  }

  /**
   * Build routing table from Dijkstra results
   */
  private buildRoutingTable(distances: Map<string, number>, previous: Map<string, string | null>): void {
    this.routingTable.clear();
    
    this.nodes.forEach((_, nodeId) => {
      if (nodeId === this.nodeId) return;
      
      const distance = distances.get(nodeId);
      if (distance === undefined || distance === Infinity) return;
      
      // Find next hop by backtracking
      let nextHop = nodeId;
      let current = nodeId;
      
      while (previous.get(current) !== this.nodeId && previous.get(current) !== null) {
        current = previous.get(current)!;
        nextHop = current;
      }
      
      if (previous.get(current) === this.nodeId) {
        const route: MeshRoute = {
          destination: nodeId,
          nextHop: nextHop,
          hopCount: this.calculateHopCount(nodeId, previous),
          cost: distance,
          lastUpdate: Date.now(),
          isActive: true
        };
        
        this.routingTable.set(nodeId, route);
      }
    });
    
    this.emit('routing:updated', Array.from(this.routingTable.values()));
  }

  /**
   * Calculate hop count from previous map
   */
  private calculateHopCount(destination: string, previous: Map<string, string | null>): number {
    let count = 0;
    let current = destination;
    
    while (previous.get(current) !== null) {
      count++;
      current = previous.get(current)!;
    }
    
    return count;
  }

  /**
   * Find alternative route when primary route fails
   */
  private findAlternativeRoute(destination: string): MeshRoute | null {
    // Simple flooding for alternative route discovery
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string, hopCount: number, route: string[] }> = [];
    
    queue.push({ nodeId: this.nodeId, hopCount: 0, route: [] });
    visited.add(this.nodeId);
    
    while (queue.length > 0) {
      const { nodeId, hopCount, route } = queue.shift()!;
      
      if (nodeId === destination) {
        return {
          destination,
          nextHop: route[0] || destination,
          hopCount,
          cost: hopCount * 10, // Simple cost calculation
          lastUpdate: Date.now(),
          isActive: true
        };
      }
      
      const node = this.nodes.get(nodeId);
      if (node && hopCount < 10) { // Limit hop count
        for (const neighborId of node.connections) {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push({
              nodeId: neighborId,
              hopCount: hopCount + 1,
              route: route.length === 0 ? [neighborId] : route
            });
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Remove routes to a specific node
   */
  private removeRoutesToNode(nodeId: string): void {
    this.routingTable.delete(nodeId);
    
    // Remove routes that go through this node
    for (const [destination, route] of this.routingTable.entries()) {
      if (route.nextHop === nodeId) {
        this.routingTable.delete(destination);
      }
    }
  }

  /**
   * Start periodic updates for routing table and node cleanup
   */
  private startPeriodicUpdates(): void {
    // Update routing table every 30 seconds
    this.routingUpdateInterval = setInterval(() => {
      this.calculateOptimalRoutes();
    }, 30000);
    
    // Clean up inactive nodes every 60 seconds
    this.nodeCleanupInterval = setInterval(() => {
      this.cleanupInactiveNodes();
    }, 60000);
  }

  /**
   * Clean up nodes that haven't been seen recently
   */
  private cleanupInactiveNodes(): void {
    const now = Date.now();
    const timeout = 300000; // 5 minutes
    
    for (const [nodeId, node] of this.nodes.entries()) {
      if (now - node.lastSeen > timeout) {
        this.removeNode(nodeId);
      }
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${this.nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public getters
  getNodes(): Map<string, MeshNode> {
    return new Map(this.nodes);
  }

  getRoutingTable(): Map<string, MeshRoute> {
    return new Map(this.routingTable);
  }

  getNodeMetrics(nodeId: string): MeshNode['metrics'] | null {
    return this.nodes.get(nodeId)?.metrics || null;
  }

  getNetworkStats() {
    return {
      totalNodes: this.nodes.size,
      activeRoutes: this.routingTable.size,
      averageLatency: this.calculateAverageLatency(),
      networkReliability: this.calculateNetworkReliability()
    };
  }

  private calculateAverageLatency(): number {
    const latencies = Array.from(this.nodes.values()).map(node => node.metrics.latency);
    return latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  }

  private calculateNetworkReliability(): number {
    const reliabilities = Array.from(this.nodes.values()).map(node => node.metrics.reliability);
    return reliabilities.length > 0 ? reliabilities.reduce((a, b) => a + b, 0) / reliabilities.length : 0;
  }

  destroy(): void {
    if (this.routingUpdateInterval) {
      clearInterval(this.routingUpdateInterval);
    }
    if (this.nodeCleanupInterval) {
      clearInterval(this.nodeCleanupInterval);
    }
    this.nodes.clear();
    this.routingTable.clear();
    this.messageBuffer.clear();
  }
}