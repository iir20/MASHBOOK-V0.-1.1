import { useState, useEffect } from 'react';
import { RadarView } from './radar-view';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { MeshNode } from '@/types/mesh';
import { useBluetoothMesh } from '@/hooks/use-bluetooth-mesh';
import { Bluetooth, WifiOff, Zap, Shield, Activity } from 'lucide-react';

interface NetworkExplorerProps {
  connectedPeers: Set<string>;
}

export function NetworkExplorer({ connectedPeers }: NetworkExplorerProps) {
  const [meshNodes, setMeshNodes] = useState<MeshNode[]>([]);
  const [currentUserId] = useState(() => Math.random().toString(36).substr(2, 9));
  
  // Initialize Bluetooth mesh
  const {
    isInitialized,
    devices,
    connectedDevices,
    networkStats,
    isScanning,
    error,
    startScanning,
    stopScanning,
    connectToDevice,
    disconnectFromDevice,
    clearError
  } = useBluetoothMesh(currentUserId);

  // Query mesh nodes from the server
  const { data: serverNodes } = useQuery({
    queryKey: ['/api/mesh-nodes'],
    queryFn: async () => {
      const response = await fetch('/api/mesh-nodes');
      return response.json();
    },
    refetchInterval: 5000,
  });

  useEffect(() => {
    // Combine server nodes with Bluetooth mesh devices
    const bluetoothNodes: MeshNode[] = devices.map((device) => ({
      id: device.id,
      name: device.name,
      walletAddress: `0x${device.id.slice(-8)}`,
      signalStrength: Math.abs(device.rssi),
      distance: Math.round(Math.pow(10, (-69 - device.rssi) / 20)),
      connectionType: 'bluetooth' as const,
      isOnline: device.isConnected,
      position: {
        x: Math.random() * 200,
        y: Math.random() * 200
      }
    }));

    const serverMeshNodes: MeshNode[] = serverNodes?.map((node: any) => ({
      id: node.nodeId,
      name: node.nodeId,
      walletAddress: `0x${node.nodeId.slice(-8)}`,
      signalStrength: node.signalStrength,
      distance: node.distance,
      connectionType: node.connectionType,
      isOnline: node.isActive,
      position: {
        x: Math.random() * 200,
        y: Math.random() * 200
      }
    })) || [];

    // Merge nodes, prioritizing Bluetooth mesh devices
    const allNodes = [...bluetoothNodes, ...serverMeshNodes];
    const uniqueNodes = allNodes.filter((node, index, self) => 
      index === self.findIndex((n) => n.id === node.id)
    );

    setMeshNodes(uniqueNodes);
  }, [serverNodes, devices]);

  const getStatusColor = (node: MeshNode) => {
    if (node.isOnline) return 'bg-[var(--cyber-green)] shadow-[0_0_10px_var(--cyber-green)]';
    if (connectedPeers.has(node.id)) return 'bg-[var(--cyber-yellow)] animate-pulse';
    return 'bg-[var(--cyber-red)]';
  };

  const getStatusText = (node: MeshNode) => {
    if (node.isOnline) return 'online';
    if (connectedPeers.has(node.id)) return 'connecting';
    return 'offline';
  };

  const handleDeviceConnect = async (deviceId: string) => {
    try {
      await connectToDevice(deviceId);
    } catch (error) {
      console.error('Failed to connect to device:', error);
    }
  };

  const handleDeviceDisconnect = async (deviceId: string) => {
    try {
      await disconnectFromDevice(deviceId);
    } catch (error) {
      console.error('Failed to disconnect from device:', error);
    }
  };

  return (
    <div className="w-80 bg-[var(--cyber-gray)] border-r border-gray-800 flex flex-col">
      {/* Network Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-[var(--cyber-cyan)]">MESH NETWORK</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_var(--cyber-green)] ${
              isInitialized ? 'bg-[var(--cyber-green)]' : 'bg-[var(--cyber-red)]'
            }`}></div>
            <span className="text-xs text-gray-400 font-mono">{meshNodes.length} NODES</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <Bluetooth className="w-4 h-4 text-[var(--cyber-cyan)]" />
            <span>{isInitialized ? 'Bluetooth Mesh Active' : 'Initializing...'}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={isScanning ? stopScanning : startScanning}
            className="text-[var(--cyber-magenta)] hover:text-[var(--cyber-cyan)]"
          >
            {isScanning ? <WifiOff className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mt-2 p-2 bg-[var(--cyber-red)]/20 border border-[var(--cyber-red)]/30 rounded text-xs text-[var(--cyber-red)]">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-2 text-[var(--cyber-red)] hover:text-white"
            >
              ×
            </Button>
          </div>
        )}
      </div>

      {/* Radar View */}
      <div className="p-4 flex-1">
        <RadarView nodes={meshNodes} />
        
        {/* Node List */}
        <div className="mt-4 space-y-2">
          {meshNodes.map((node) => (
            <Card key={node.id} className="p-2 bg-[var(--cyber-dark)]/50 border-gray-800 hover:border-[var(--cyber-cyan)]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(node)}`}></div>
                  <div>
                    <div className="text-sm font-medium">{node.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{node.walletAddress}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[var(--cyber-cyan)]">{node.distance}m</div>
                  <div className="flex items-center space-x-1">
                    <Badge variant="outline" className="text-xs">
                      {node.connectionType}
                    </Badge>
                    {node.connectionType === 'bluetooth' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => node.isOnline ? handleDeviceDisconnect(node.id) : handleDeviceConnect(node.id)}
                        className="text-xs px-1 py-0.5 h-6"
                      >
                        {node.isOnline ? 'Disconnect' : 'Connect'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Connection Stats */}
      <div className="p-4 border-t border-gray-800">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="glass-morphism rounded-lg p-3">
            <div className="text-[var(--cyber-cyan)] font-mono text-lg font-bold">
              {connectedDevices.length}
            </div>
            <div className="text-xs text-gray-400">Connected</div>
          </div>
          <div className="glass-morphism rounded-lg p-3">
            <div className="text-[var(--cyber-green)] font-mono text-lg font-bold">
              {networkStats.totalDevices}
            </div>
            <div className="text-xs text-gray-400">Discovered</div>
          </div>
        </div>
        
        {/* Bluetooth Mesh Stats */}
        {isInitialized && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Routing Entries:</span>
              <span className="text-[var(--cyber-magenta)] font-mono">{networkStats.routingEntries}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Message Buffer:</span>
              <span className="text-[var(--cyber-yellow)] font-mono">{networkStats.messageBufferSize}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Mesh Health:</span>
              <span className="text-[var(--cyber-green)] font-mono">
                {connectedDevices.length > 0 ? '100%' : '0%'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
