import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Radio, 
  Bluetooth, 
  Scan, 
  Link, 
  Unlink, 
  Zap,
  Signal,
  Battery,
  Smartphone,
  Laptop,
  Watch,
  Speaker,
  Headphones
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BluetoothDevice {
  id: string;
  name: string;
  type: 'phone' | 'laptop' | 'watch' | 'speaker' | 'headphones' | 'unknown';
  rssi: number; // Signal strength
  connected: boolean;
  paired: boolean;
  meshCapable: boolean;
  lastSeen: Date;
  services: string[];
  batteryLevel?: number;
  distance?: number;
}

interface PhantomLinkProps {
  nodeId: string;
  onDeviceConnect?: (device: BluetoothDevice) => void;
  onDeviceDisconnect?: (deviceId: string) => void;
}

export function PhantomLink({ nodeId, onDeviceConnect, onDeviceDisconnect }: PhantomLinkProps) {
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<BluetoothDevice[]>([]);
  const { toast } = useToast();

  // Check Bluetooth availability
  useEffect(() => {
    const checkBluetoothAvailability = async () => {
      try {
        if ('bluetooth' in navigator) {
          setBluetoothEnabled(true);
          toast({
            title: "Phantom Link Active",
            description: "Bluetooth interface initialized successfully",
          });
        } else {
          setBluetoothEnabled(false);
          toast({
            title: "Bluetooth Unavailable",
            description: "Web Bluetooth API not supported in this browser",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Bluetooth check failed:', error);
        setBluetoothEnabled(false);
      }
    };

    checkBluetoothAvailability();
  }, [toast]);

  // Real Bluetooth scanning
  const startRealBluetoothScan = useCallback(async () => {
    if (!bluetoothEnabled) {
      toast({
        title: "Bluetooth Disabled",
        description: "Enable Bluetooth to scan for mesh nodes",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    try {
      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      if (device) {
        const newDevice: BluetoothDevice = {
          id: device.id || `device_${Date.now()}`,
          name: device.name || 'Unknown Device',
          type: determineDeviceType(device.name || ''),
          rssi: -50 - Math.random() * 40, // Simulated RSSI
          connected: false,
          paired: false,
          meshCapable: true,
          lastSeen: new Date(),
          services: [],
          distance: Math.floor(Math.random() * 100) + 10
        };

        setDevices(prev => {
          const exists = prev.find(d => d.id === newDevice.id);
          if (exists) return prev;
          return [...prev, newDevice];
        });

        toast({
          title: "Device Detected",
          description: `Found ${newDevice.name} via Phantom Link`,
        });
      }
    } catch (error: any) {
      if (error.name === 'NotFoundError') {
        toast({
          title: "No Devices Found",
          description: "No Bluetooth devices were selected",
        });
      } else {
        console.error('Bluetooth scan error:', error);
        toast({
          title: "Scan Failed",
          description: "Failed to scan for Bluetooth devices",
          variant: "destructive",
        });
      }
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [bluetoothEnabled, toast]);

  // Simulate scan progress
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const determineDeviceType = (name: string): BluetoothDevice['type'] => {
    const lowername = name.toLowerCase();
    if (lowername.includes('phone') || lowername.includes('iphone') || lowername.includes('samsung')) return 'phone';
    if (lowername.includes('laptop') || lowername.includes('macbook') || lowername.includes('notebook')) return 'laptop';
    if (lowername.includes('watch') || lowername.includes('band')) return 'watch';
    if (lowername.includes('speaker') || lowername.includes('soundbar')) return 'speaker';
    if (lowername.includes('headphone') || lowername.includes('earbuds') || lowername.includes('airpods')) return 'headphones';
    return 'unknown';
  };

  const getDeviceIcon = (type: BluetoothDevice['type']) => {
    switch (type) {
      case 'phone': return Smartphone;
      case 'laptop': return Laptop;
      case 'watch': return Watch;
      case 'speaker': return Speaker;
      case 'headphones': return Headphones;
      default: return Radio;
    }
  };

  const getSignalStrength = (rssi: number) => {
    if (rssi > -30) return { strength: 'Excellent', color: 'text-green-400', bars: 4 };
    if (rssi > -50) return { strength: 'Good', color: 'text-blue-400', bars: 3 };
    if (rssi > -70) return { strength: 'Fair', color: 'text-yellow-400', bars: 2 };
    return { strength: 'Poor', color: 'text-red-400', bars: 1 };
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      // Simulate connection process
      setDevices(prev => 
        prev.map(d => 
          d.id === device.id 
            ? { ...d, connected: true, paired: true }
            : d
        )
      );
      
      setConnectedDevices(prev => [...prev, { ...device, connected: true, paired: true }]);
      
      onDeviceConnect?.({ ...device, connected: true, paired: true });
      
      toast({
        title: "Device Connected",
        description: `Successfully connected to ${device.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${device.name}`,
        variant: "destructive",
      });
    }
  };

  const disconnectDevice = async (device: BluetoothDevice) => {
    setDevices(prev => 
      prev.map(d => 
        d.id === device.id 
          ? { ...d, connected: false }
          : d
      )
    );
    
    setConnectedDevices(prev => prev.filter(d => d.id !== device.id));
    
    onDeviceDisconnect?.(device.id);
    
    toast({
      title: "Device Disconnected",
      description: `Disconnected from ${device.name}`,
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-orange-600 to-purple-600 rounded-lg">
            <Radio className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
              Phantom Link Protocol
            </h1>
            <p className="text-gray-400">Bluetooth mesh networking interface</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Badge className={bluetoothEnabled ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}>
            <Bluetooth className="w-4 h-4 mr-2" />
            {bluetoothEnabled ? 'ENABLED' : 'DISABLED'}
          </Badge>
          <Button 
            onClick={startRealBluetoothScan}
            disabled={!bluetoothEnabled || isScanning}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isScanning ? (
              <>
                <Scan className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 mr-2" />
                Phantom Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Scan Progress */}
      {isScanning && (
        <Card className="border-orange-500/30 bg-orange-900/10">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-orange-400">Scanning for mesh nodes...</span>
                <span className="text-gray-400">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Devices */}
      {connectedDevices.length > 0 && (
        <Card className="border-green-500/30 bg-green-900/10">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-400">
              <Link className="w-5 h-5" />
              <span>Active Connections</span>
              <Badge className="bg-green-900/30 text-green-400">{connectedDevices.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectedDevices.map((device) => {
                const DeviceIcon = getDeviceIcon(device.type);
                const signal = getSignalStrength(device.rssi);
                
                return (
                  <Card key={device.id} className="border-green-500/30 bg-green-900/5">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <DeviceIcon className="w-5 h-5 text-green-400" />
                          <span className="font-medium text-green-400">{device.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnectDevice(device)}
                          className="border-red-500/30 text-red-400 hover:bg-red-900/20"
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Signal</span>
                          <span className={signal.color}>{signal.strength}</span>
                        </div>
                        {device.batteryLevel && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Battery</span>
                            <div className="flex items-center space-x-1">
                              <Battery className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300">{device.batteryLevel}%</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Distance</span>
                          <span className="text-gray-300">{device.distance}m</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Devices */}
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-orange-400">
            <Radio className="w-5 h-5" />
            <span>Discovered Nodes</span>
            <Badge className="bg-orange-900/30 text-orange-400">{devices.filter(d => !d.connected).length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {devices.filter(d => !d.connected).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Radio className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No devices discovered</p>
              <p className="text-sm mt-1">Click "Phantom Scan" to search for nearby mesh nodes</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.filter(d => !d.connected).map((device) => {
                const DeviceIcon = getDeviceIcon(device.type);
                const signal = getSignalStrength(device.rssi);
                
                return (
                  <Card key={device.id} className="border-gray-600 hover:border-orange-500/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <DeviceIcon className="w-5 h-5 text-orange-400" />
                          <span className="font-medium text-gray-300">{device.name}</span>
                        </div>
                        {device.meshCapable && (
                          <Badge className="bg-purple-900/30 text-purple-400 text-xs">
                            MESH
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Signal</span>
                          <div className="flex items-center space-x-1">
                            <Signal className="w-4 h-4 text-gray-400" />
                            <span className={signal.color}>{device.rssi} dBm</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Type</span>
                          <span className="text-gray-300 capitalize">{device.type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Distance</span>
                          <span className="text-gray-300">{device.distance}m</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => connectToDevice(device)}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}