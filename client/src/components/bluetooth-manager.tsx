import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bluetooth, 
  Search, 
  Wifi, 
  Signal, 
  Smartphone, 
  Laptop, 
  Tablet,
  Speaker,
  Headphones,
  Watch,
  RefreshCw,
  Link,
  Unlink,
  AlertCircle,
  CheckCircle,
  Power,
  Settings,
  Shield,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BluetoothDevice {
  id: string;
  name: string;
  type: 'phone' | 'laptop' | 'tablet' | 'speaker' | 'headphones' | 'watch' | 'unknown';
  rssi: number;
  connected: boolean;
  paired: boolean;
  lastSeen: Date;
  services: string[];
  batteryLevel?: number;
  meshCapable: boolean;
}

interface BluetoothManagerProps {
  nodeId: string;
}

export function BluetoothManager({ nodeId }: BluetoothManagerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<BluetoothDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const { toast } = useToast();

  // Mock devices for demonstration
  const mockDevices: BluetoothDevice[] = [
    {
      id: 'dev_phone_001',
      name: 'CyberPhone Alpha',
      type: 'phone',
      rssi: -45,
      connected: true,
      paired: true,
      lastSeen: new Date(),
      services: ['mesh-relay', 'file-transfer', 'chat'],
      batteryLevel: 87,
      meshCapable: true
    },
    {
      id: 'dev_laptop_002',
      name: 'MeshBook Pro',
      type: 'laptop',
      rssi: -62,
      connected: false,
      paired: true,
      lastSeen: new Date(Date.now() - 5 * 60 * 1000),
      services: ['mesh-gateway', 'file-transfer'],
      meshCapable: true
    },
    {
      id: 'dev_watch_003',
      name: 'NeuralWatch X1',
      type: 'watch',
      rssi: -38,
      connected: true,
      paired: true,
      lastSeen: new Date(),
      services: ['mesh-relay', 'notifications'],
      batteryLevel: 45,
      meshCapable: true
    },
    {
      id: 'dev_speaker_004',
      name: 'AudioNode Hub',
      type: 'speaker',
      rssi: -78,
      connected: false,
      paired: false,
      lastSeen: new Date(Date.now() - 15 * 60 * 1000),
      services: ['audio', 'mesh-relay'],
      meshCapable: true
    }
  ];

  useEffect(() => {
    // Simulate bluetooth status check
    const checkBluetoothStatus = async () => {
      try {
        if (navigator.bluetooth) {
          setBluetoothEnabled(true);
          setDevices(mockDevices);
          setConnectedDevices(mockDevices.filter(d => d.connected));
        } else {
          setBluetoothEnabled(false);
        }
      } catch (error) {
        console.error('Bluetooth check failed:', error);
        setBluetoothEnabled(false);
      }
    };

    checkBluetoothStatus();
  }, []);

  const startScan = useCallback(async () => {
    if (!bluetoothEnabled) {
      toast({
        title: "Bluetooth Disabled",
        description: "Please enable Bluetooth to scan for devices",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          toast({
            title: "Scan Complete",
            description: `Found ${mockDevices.length} devices`,
          });
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    try {
      // In a real implementation, this would use the Web Bluetooth API
      // const device = await navigator.bluetooth.requestDevice({
      //   acceptAllDevices: true,
      //   optionalServices: ['battery_service']
      // });
      
      setTimeout(() => {
        setDevices(mockDevices);
      }, 2000);
      
    } catch (error) {
      console.error('Bluetooth scan failed:', error);
      setIsScanning(false);
      setScanProgress(0);
      toast({
        title: "Scan Failed",
        description: "Failed to scan for Bluetooth devices",
        variant: "destructive",
      });
    }
  }, [bluetoothEnabled, toast]);

  const connectToDevice = useCallback(async (device: BluetoothDevice) => {
    try {
      toast({
        title: "Connecting...",
        description: `Connecting to ${device.name}`,
      });

      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedDevices = devices.map(d => 
        d.id === device.id ? { ...d, connected: true, paired: true } : d
      );
      setDevices(updatedDevices);
      setConnectedDevices(updatedDevices.filter(d => d.connected));

      toast({
        title: "Connected",
        description: `Successfully connected to ${device.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${device.name}`,
        variant: "destructive",
      });
    }
  }, [devices, toast]);

  const disconnectFromDevice = useCallback(async (device: BluetoothDevice) => {
    try {
      const updatedDevices = devices.map(d => 
        d.id === device.id ? { ...d, connected: false } : d
      );
      setDevices(updatedDevices);
      setConnectedDevices(updatedDevices.filter(d => d.connected));

      toast({
        title: "Disconnected",
        description: `Disconnected from ${device.name}`,
      });
    } catch (error) {
      toast({
        title: "Disconnection Failed",
        description: `Failed to disconnect from ${device.name}`,
        variant: "destructive",
      });
    }
  }, [devices, toast]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return <Smartphone className="w-5 h-5" />;
      case 'laptop':
        return <Laptop className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      case 'speaker':
        return <Speaker className="w-5 h-5" />;
      case 'headphones':
        return <Headphones className="w-5 h-5" />;
      case 'watch':
        return <Watch className="w-5 h-5" />;
      default:
        return <Bluetooth className="w-5 h-5" />;
    }
  };

  const getSignalStrength = (rssi: number) => {
    if (rssi > -50) return { strength: 'excellent', color: 'text-green-500', bars: 4 };
    if (rssi > -60) return { strength: 'good', color: 'text-blue-500', bars: 3 };
    if (rssi > -70) return { strength: 'fair', color: 'text-yellow-500', bars: 2 };
    return { strength: 'poor', color: 'text-red-500', bars: 1 };
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--cyber-cyan)]">Bluetooth Manager</h2>
          <p className="text-gray-400 mt-1">Discover and connect mesh-enabled devices</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={bluetoothEnabled ? 'text-[var(--cyber-green)]' : 'text-[var(--cyber-red)]'}>
            <Power className="w-3 h-3 mr-1" />
            {bluetoothEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
          <Button 
            onClick={startScan}
            disabled={isScanning || !bluetoothEnabled}
          >
            <Search className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Scan'}
          </Button>
        </div>
      </div>

      {/* Bluetooth Status */}
      {!bluetoothEnabled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Bluetooth is not available or disabled. Please enable Bluetooth to discover and connect to mesh devices.
          </AlertDescription>
        </Alert>
      )}

      {/* Scan Progress */}
      {isScanning && (
        <Card className="glass-morphism">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Search className="w-5 h-5 text-[var(--cyber-cyan)] animate-pulse" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span>Scanning for devices...</span>
                  <span>{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Devices */}
      {connectedDevices.length > 0 && (
        <Card className="glass-morphism">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link className="w-5 h-5" />
              <span>Connected Devices</span>
            </CardTitle>
            <CardDescription>
              Currently connected mesh devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connectedDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-[var(--cyber-green)]">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Signal className={`w-3 h-3 ${getSignalStrength(device.rssi).color}`} />
                        <span>{device.rssi} dBm</span>
                        {device.batteryLevel && (
                          <>
                            <span>•</span>
                            <span>{device.batteryLevel}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {device.meshCapable && (
                      <Badge variant="outline" className="text-[var(--cyber-cyan)]">
                        <Shield className="w-3 h-3 mr-1" />
                        Mesh
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => disconnectFromDevice(device)}
                    >
                      <Unlink className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Devices */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bluetooth className="w-5 h-5" />
            <span>Available Devices</span>
          </CardTitle>
          <CardDescription>
            Bluetooth devices in range
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length > 0 ? (
            <div className="space-y-4">
              {devices.map((device) => (
                <div 
                  key={device.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedDevice?.id === device.id 
                      ? 'border-[var(--cyber-cyan)] bg-[var(--cyber-cyan)]/10' 
                      : 'border-gray-700 hover:border-[var(--cyber-cyan)]/50'
                  }`}
                  onClick={() => setSelectedDevice(selectedDevice?.id === device.id ? null : device)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={device.connected ? 'text-[var(--cyber-green)]' : 'text-gray-400'}>
                        {getDeviceIcon(device.type)}
                      </div>
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Signal className={`w-3 h-3 ${getSignalStrength(device.rssi).color}`} />
                          <span>{getSignalStrength(device.rssi).strength}</span>
                          <span>•</span>
                          <span>{getRelativeTime(device.lastSeen)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {device.meshCapable && (
                        <Badge variant="outline" className="text-[var(--cyber-cyan)]">
                          <Zap className="w-3 h-3 mr-1" />
                          Mesh
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={device.connected ? 'text-[var(--cyber-green)]' : 'text-gray-400'}
                      >
                        {device.connected ? <CheckCircle className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {device.connected ? 'Connected' : device.paired ? 'Paired' : 'Available'}
                      </Badge>
                      {!device.connected && (
                        <Button
                          size="sm"
                          onClick={() => connectToDevice(device)}
                        >
                          <Link className="w-4 h-4 mr-1" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>

                  {selectedDevice?.id === device.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Signal Strength</p>
                          <p className="text-lg font-bold text-[var(--cyber-cyan)]">{device.rssi} dBm</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Device Type</p>
                          <p className="text-lg font-bold text-[var(--cyber-green)] capitalize">{device.type}</p>
                        </div>
                        {device.batteryLevel && (
                          <div>
                            <p className="text-sm text-gray-400">Battery Level</p>
                            <p className="text-lg font-bold text-[var(--cyber-yellow)]">{device.batteryLevel}%</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-400">Services</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {device.services.map((service, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Bluetooth className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No devices found</p>
              <p className="text-sm mt-2">Start scanning to discover nearby devices</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mesh Network Status */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wifi className="w-5 h-5" />
            <span>Mesh Network Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--cyber-cyan)]">
                {connectedDevices.filter(d => d.meshCapable).length}
              </div>
              <div className="text-sm text-gray-400">Mesh Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--cyber-green)]">
                {connectedDevices.length > 0 ? 'Active' : 'Inactive'}
              </div>
              <div className="text-sm text-gray-400">Network Status</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--cyber-magenta)]">
                {bluetoothEnabled ? 'Ready' : 'Disabled'}
              </div>
              <div className="text-sm text-gray-400">Bluetooth Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}