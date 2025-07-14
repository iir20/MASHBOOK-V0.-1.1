import { useState, useEffect, useRef } from 'react';
import { BluetoothMeshManager, BluetoothMeshDevice, MeshMessage } from '@/lib/bluetooth-mesh';

export function useBluetoothMesh(nodeId: string) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [devices, setDevices] = useState<BluetoothMeshDevice[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<BluetoothMeshDevice[]>([]);
  const [messages, setMessages] = useState<MeshMessage[]>([]);
  const [networkStats, setNetworkStats] = useState({
    totalDevices: 0,
    connectedDevices: 0,
    routingEntries: 0,
    messageBufferSize: 0
  });
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const meshManagerRef = useRef<BluetoothMeshManager | null>(null);

  useEffect(() => {
    const initializeMesh = async () => {
      try {
        const meshManager = new BluetoothMeshManager(nodeId);
        meshManagerRef.current = meshManager;

        // Set up event listeners
        meshManager.on('initialized', () => {
          setIsInitialized(true);
          setError(null);
        });

        meshManager.on('deviceDiscovered', (device: BluetoothMeshDevice) => {
          setDevices(prev => {
            const existing = prev.find(d => d.id === device.id);
            if (existing) {
              return prev.map(d => d.id === device.id ? device : d);
            }
            return [...prev, device];
          });
        });

        meshManager.on('deviceConnected', (device: BluetoothMeshDevice) => {
          setConnectedDevices(prev => {
            const existing = prev.find(d => d.id === device.id);
            if (existing) {
              return prev.map(d => d.id === device.id ? device : d);
            }
            return [...prev, device];
          });
          updateNetworkStats();
        });

        meshManager.on('deviceDisconnected', (device: BluetoothMeshDevice) => {
          setConnectedDevices(prev => prev.filter(d => d.id !== device.id));
          updateNetworkStats();
        });

        meshManager.on('messageSent', (message: MeshMessage, deviceId: string) => {
          setMessages(prev => [...prev, message].slice(-100)); // Keep last 100 messages
        });

        meshManager.on('error', (error: Error) => {
          setError(error.message);
        });

        await meshManager.initialize();
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    const updateNetworkStats = () => {
      if (meshManagerRef.current) {
        const stats = meshManagerRef.current.getNetworkStats();
        setNetworkStats(stats);
      }
    };

    initializeMesh();
    
    // Update stats periodically
    const statsInterval = setInterval(updateNetworkStats, 5000);

    return () => {
      clearInterval(statsInterval);
      if (meshManagerRef.current) {
        meshManagerRef.current.destroy();
      }
    };
  }, [nodeId]);

  const startScanning = async () => {
    if (!meshManagerRef.current) return;
    
    setIsScanning(true);
    try {
      await meshManagerRef.current.startScanning();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Scanning failed');
    }
  };

  const stopScanning = () => {
    if (!meshManagerRef.current) return;
    
    meshManagerRef.current.stopScanning();
    setIsScanning(false);
  };

  const connectToDevice = async (deviceId: string): Promise<boolean> => {
    if (!meshManagerRef.current) return false;
    
    try {
      return await meshManagerRef.current.connectToDevice(deviceId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed');
      return false;
    }
  };

  const disconnectFromDevice = async (deviceId: string) => {
    if (!meshManagerRef.current) return;
    
    try {
      await meshManagerRef.current.disconnectFromDevice(deviceId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Disconnection failed');
    }
  };

  const sendMessage = async (content: string, targetId?: string): Promise<void> => {
    if (!meshManagerRef.current) return;
    
    try {
      await meshManagerRef.current.sendMessage({
        type: 'chat',
        sourceId: nodeId,
        targetId,
        content,
        ttl: 5,
        encrypted: false
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Message send failed');
    }
  };

  const broadcastMessage = async (content: string): Promise<void> => {
    await sendMessage(content);
  };

  const getRoutingTable = () => {
    return meshManagerRef.current?.getRoutingTable() || new Map();
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isInitialized,
    devices,
    connectedDevices,
    messages,
    networkStats,
    isScanning,
    error,
    startScanning,
    stopScanning,
    connectToDevice,
    disconnectFromDevice,
    sendMessage,
    broadcastMessage,
    getRoutingTable,
    clearError
  };
}