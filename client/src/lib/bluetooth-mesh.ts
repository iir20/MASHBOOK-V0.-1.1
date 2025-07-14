// Browser-compatible event emitter
class SimpleEventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  emit(event: string, ...args: any[]) {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }

  removeAllListeners() {
    this.events.clear();
  }
}

export interface BluetoothMeshDevice {
  id: string;
  name: string;
  address: string;
  rssi: number;
  isConnected: boolean;
  lastSeen: Date;
  capabilities: BluetoothCapabilities;
  meshRole: 'node' | 'relay' | 'gateway';
}

export interface BluetoothCapabilities {
  canRelay: boolean;
  maxConnections: number;
  supportedServices: string[];
}

export interface MeshMessage {
  id: string;
  type: 'chat' | 'relay' | 'discovery' | 'heartbeat';
  sourceId: string;
  targetId?: string;
  content: string;
  timestamp: Date;
  ttl: number;
  hopCount: number;
  route: string[];
  encrypted: boolean;
}

export interface MeshRoute {
  targetId: string;
  nextHop: string;
  hopCount: number;
  lastUpdate: Date;
}

export class BluetoothMeshManager extends SimpleEventEmitter {
  private devices: Map<string, BluetoothMeshDevice> = new Map();
  private connections: Map<string, BluetoothRemoteGATTServer> = new Map();
  private routingTable: Map<string, MeshRoute> = new Map();
  private messageBuffer: Map<string, MeshMessage> = new Map();
  private nodeId: string;
  private isScanning: boolean = false;
  private scanInterval?: NodeJS.Timeout;
  private heartbeatInterval?: NodeJS.Timeout;
  
  // Custom UUIDs for mesh networking
  private static readonly MESH_SERVICE_UUID = '12345678-1234-5678-9012-123456789abc';
  private static readonly MESSAGE_CHARACTERISTIC_UUID = '12345678-1234-5678-9012-123456789abd';
  private static readonly ROUTING_CHARACTERISTIC_UUID = '12345678-1234-5678-9012-123456789abe';
  private static readonly DISCOVERY_CHARACTERISTIC_UUID = '12345678-1234-5678-9012-123456789abf';

  constructor(nodeId: string) {
    super();
    this.nodeId = nodeId;
    this.setupHeartbeat();
  }

  async initialize(): Promise<void> {
    if (!('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    try {
      await this.startAdvertising();
      await this.startScanning();
      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async startAdvertising(): Promise<void> {
    // Note: Web Bluetooth doesn't support advertising directly
    // This would typically be handled by a service worker or native app
    console.log('Starting Bluetooth advertising for mesh node:', this.nodeId);
  }

  async startScanning(): Promise<void> {
    if (this.isScanning) return;
    
    this.isScanning = true;
    this.scanInterval = setInterval(async () => {
      try {
        await this.discoverDevices();
      } catch (error) {
        console.error('Scan error:', error);
      }
    }, 5000);
  }

  stopScanning(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = undefined;
    }
    this.isScanning = false;
  }

  private async discoverDevices(): Promise<void> {
    try {
      // In a real implementation, this would use navigator.bluetooth.requestDevice()
      // For now, we'll simulate device discovery
      const mockDevices: BluetoothMeshDevice[] = [
        {
          id: 'mesh_node_1',
          name: 'CyberNode_A1',
          address: '00:11:22:33:44:55',
          rssi: -45,
          isConnected: false,
          lastSeen: new Date(),
          capabilities: {
            canRelay: true,
            maxConnections: 4,
            supportedServices: [BluetoothMeshManager.MESH_SERVICE_UUID]
          },
          meshRole: 'node'
        },
        {
          id: 'mesh_relay_2',
          name: 'MeshRelay_B7',
          address: '00:11:22:33:44:66',
          rssi: -60,
          isConnected: false,
          lastSeen: new Date(),
          capabilities: {
            canRelay: true,
            maxConnections: 8,
            supportedServices: [BluetoothMeshManager.MESH_SERVICE_UUID]
          },
          meshRole: 'relay'
        }
      ];

      mockDevices.forEach(device => {
        if (!this.devices.has(device.id)) {
          this.devices.set(device.id, device);
          this.emit('deviceDiscovered', device);
        }
      });
    } catch (error) {
      console.error('Device discovery failed:', error);
    }
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    try {
      // In a real implementation, this would connect to the actual device
      // For now, we'll simulate the connection
      device.isConnected = true;
      this.devices.set(deviceId, device);
      
      // Update routing table
      this.updateRoutingTable(deviceId, deviceId, 1);
      
      this.emit('deviceConnected', device);
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      this.emit('connectionFailed', deviceId, error);
      return false;
    }
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device) return;

    const connection = this.connections.get(deviceId);
    if (connection) {
      connection.disconnect();
      this.connections.delete(deviceId);
    }

    device.isConnected = false;
    this.devices.set(deviceId, device);
    
    // Remove from routing table
    this.routingTable.delete(deviceId);
    
    this.emit('deviceDisconnected', device);
  }

  async sendMessage(message: Omit<MeshMessage, 'id' | 'timestamp' | 'hopCount' | 'route'>): Promise<void> {
    const meshMessage: MeshMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      hopCount: 0,
      route: [this.nodeId],
      ...message
    };

    // Store in buffer
    this.messageBuffer.set(meshMessage.id, meshMessage);
    
    if (message.targetId) {
      // Directed message
      await this.routeMessage(meshMessage);
    } else {
      // Broadcast message
      await this.broadcastMessage(meshMessage);
    }
  }

  private async routeMessage(message: MeshMessage): Promise<void> {
    if (!message.targetId) return;

    const route = this.routingTable.get(message.targetId);
    if (!route) {
      console.warn('No route found for target:', message.targetId);
      return;
    }

    if (route.nextHop === message.targetId) {
      // Direct connection
      await this.sendDirectMessage(message.targetId, message);
    } else {
      // Relay through intermediate node
      await this.relayMessage(route.nextHop, message);
    }
  }

  private async broadcastMessage(message: MeshMessage): Promise<void> {
    const connectedDevices = Array.from(this.devices.values()).filter(d => d.isConnected);
    
    for (const device of connectedDevices) {
      try {
        await this.sendDirectMessage(device.id, message);
      } catch (error) {
        console.error('Broadcast failed to device:', device.id, error);
      }
    }
  }

  private async sendDirectMessage(deviceId: string, message: MeshMessage): Promise<void> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isConnected) {
      throw new Error(`Device ${deviceId} not connected`);
    }

    // Update message metadata
    message.hopCount++;
    message.route.push(deviceId);

    // In a real implementation, this would send via GATT characteristic
    console.log('Sending message to device:', deviceId, message);
    
    // Simulate message transmission
    setTimeout(() => {
      this.emit('messageSent', message, deviceId);
    }, 100);
  }

  private async relayMessage(nextHopId: string, message: MeshMessage): Promise<void> {
    if (message.ttl <= 0) {
      console.warn('Message TTL expired, dropping:', message.id);
      return;
    }

    message.ttl--;
    await this.sendDirectMessage(nextHopId, message);
  }

  private updateRoutingTable(targetId: string, nextHop: string, hopCount: number): void {
    const existing = this.routingTable.get(targetId);
    if (!existing || existing.hopCount > hopCount) {
      this.routingTable.set(targetId, {
        targetId,
        nextHop,
        hopCount,
        lastUpdate: new Date()
      });
    }
  }

  private setupHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Send heartbeat every 30 seconds
  }

  private async sendHeartbeat(): Promise<void> {
    const heartbeatMessage: Omit<MeshMessage, 'id' | 'timestamp' | 'hopCount' | 'route'> = {
      type: 'heartbeat',
      sourceId: this.nodeId,
      content: JSON.stringify({
        nodeId: this.nodeId,
        timestamp: new Date().toISOString(),
        connectedDevices: Array.from(this.devices.values()).filter(d => d.isConnected).length
      }),
      ttl: 3,
      encrypted: false
    };

    await this.sendMessage(heartbeatMessage);
  }

  getConnectedDevices(): BluetoothMeshDevice[] {
    return Array.from(this.devices.values()).filter(d => d.isConnected);
  }

  getAllDevices(): BluetoothMeshDevice[] {
    return Array.from(this.devices.values());
  }

  getRoutingTable(): Map<string, MeshRoute> {
    return new Map(this.routingTable);
  }

  getNetworkStats(): {
    totalDevices: number;
    connectedDevices: number;
    routingEntries: number;
    messageBufferSize: number;
  } {
    return {
      totalDevices: this.devices.size,
      connectedDevices: this.getConnectedDevices().length,
      routingEntries: this.routingTable.size,
      messageBufferSize: this.messageBuffer.size
    };
  }

  destroy(): void {
    this.stopScanning();
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Disconnect all devices
    Array.from(this.devices.keys()).forEach(deviceId => {
      this.disconnectFromDevice(deviceId);
    });

    this.removeAllListeners();
  }
}