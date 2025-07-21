import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Users, 
  Bluetooth, 
  Signal, 
  AlertTriangle, 
  Zap, 
  Shield, 
  Wifi, 
  CheckCircle,
  XCircle,
  Clock,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRealBluetooth } from '@/hooks/use-real-bluetooth';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { useToast } from '@/hooks/use-toast';

interface EnhancedRealBluetoothScannerProps {
  onDeviceDetected?: (device: any) => void;
  onScanStateChange?: (isScanning: boolean) => void;
  className?: string;
}

export function EnhancedRealBluetoothScanner({ 
  onDeviceDetected, 
  onScanStateChange, 
  className 
}: EnhancedRealBluetoothScannerProps) {
  const [scanProgress, setScanProgress] = useState(0);
  const [networkStats, setNetworkStats] = useState({
    totalDevices: 0,
    meshCapable: 0,
    connected: 0,
    trusted: 0
  });

  const { toast } = useToast();
  const { isOnline, offlineData } = useOfflineStorage();
  
  const {
    devices,
    isScanning,
    isSupported,
    error,
    connectedDevices,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    getRecentDevices,
    getMeshCapableDevices
  } = useRealBluetooth();

  // Notify parent components about scan state changes
  useEffect(() => {
    onScanStateChange?.(isScanning);
  }, [isScanning, onScanStateChange]);

  // Notify parent about new devices
  useEffect(() => {
    devices.forEach(device => {
      onDeviceDetected?.(device);
    });
  }, [devices, onDeviceDetected]);

  // Update network statistics
  useEffect(() => {
    const recentDevices = getRecentDevices(10); // Last 10 minutes
    const meshCapable = getMeshCapableDevices();
    
    setNetworkStats({
      totalDevices: recentDevices.length,
      meshCapable: meshCapable.length,
      connected: connectedDevices.length,
      trusted: recentDevices.filter(d => d.authenticated).length
    });
  }, [devices, connectedDevices, getRecentDevices, getMeshCapableDevices]);

  // Scan progress animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isScanning) {
      interval = setInterval(() => {
        setScanProgress(prev => (prev + 2) % 100);
      }, 200);
    } else {
      setScanProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isScanning]);

  const handleToggleScan = async () => {
    try {
      if (isScanning) {
        await stopScan();
        toast({
          title: "Scan Stopped",
          description: "Bluetooth device scanning has been stopped."
        });
      } else {
        await startScan();
        toast({
          title: "Scan Started", 
          description: "Scanning for nearby Bluetooth devices and mesh nodes."
        });
      }
    } catch (err: any) {
      toast({
        title: "Scan Error",
        description: err.message || "Failed to toggle Bluetooth scanning",
        variant: "destructive"
      });
    }
  };

  const handleConnect = async (deviceId: string) => {
    const success = await connectToDevice(deviceId);
    if (success) {
      toast({
        title: "Device Connected",
        description: "Successfully connected to Bluetooth device"
      });
    } else {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to device",
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async (deviceId: string) => {
    const success = await disconnectFromDevice(deviceId);
    if (success) {
      toast({
        title: "Device Disconnected",
        description: "Successfully disconnected from device"
      });
    }
  };

  const getDeviceStatusIcon = (device: any) => {
    if (device.connected) return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (device.meshCapable) return <Shield className="w-4 h-4 text-blue-400" />;
    if (device.authenticated) return <Zap className="w-4 h-4 text-yellow-400" />;
    return <Bluetooth className="w-4 h-4 text-gray-400" />;
  };

  const getDeviceAge = (lastSeen: number) => {
    const seconds = Math.floor((Date.now() - lastSeen) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const recentDevices = getRecentDevices(5); // Last 5 minutes
  const meshDevices = getMeshCapableDevices();

  return (
    <div className={cn("w-full max-w-6xl mx-auto space-y-6 p-4", className)}>
      {/* Header & Status */}
      <Card className="border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-purple-900/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bluetooth className="w-10 h-10 text-blue-400" />
                {isScanning && (
                  <div className="absolute -inset-2 rounded-full border-2 border-blue-400 animate-ping" />
                )}
              </div>
              <div>
                <CardTitle className="text-blue-400 text-xl">Enhanced Bluetooth Scanner</CardTitle>
                <p className="text-gray-400">
                  Real device discovery and mesh network detection
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Online/Offline Status */}
              <Badge className={isOnline ? "bg-green-600 text-white" : "bg-red-600 text-white"}>
                {isOnline ? <Globe className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
              
              <Button
                onClick={handleToggleScan}
                disabled={!isSupported}
                className={cn(
                  "min-w-[140px]",
                  isScanning 
                    ? "bg-red-600 hover:bg-red-700 text-white" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                {isScanning ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Scanning
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Scanning
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Scan Progress */}
          {isScanning && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Scanning for Bluetooth devices...</span>
                <span>{networkStats.totalDevices} devices found</span>
              </div>
              <Progress value={scanProgress} className="h-2 bg-gray-800" />
            </div>
          )}
        </CardHeader>

        {/* Network Statistics */}
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border border-blue-500/20 rounded-lg bg-blue-900/10 text-center">
              <div className="text-2xl font-bold text-blue-400">{networkStats.totalDevices}</div>
              <div className="text-sm text-gray-400">Total Devices</div>
            </div>
            <div className="p-4 border border-purple-500/20 rounded-lg bg-purple-900/10 text-center">
              <div className="text-2xl font-bold text-purple-400">{networkStats.meshCapable}</div>
              <div className="text-sm text-gray-400">Mesh Capable</div>
            </div>
            <div className="p-4 border border-green-500/20 rounded-lg bg-green-900/10 text-center">
              <div className="text-2xl font-bold text-green-400">{networkStats.connected}</div>
              <div className="text-sm text-gray-400">Connected</div>
            </div>
            <div className="p-4 border border-yellow-500/20 rounded-lg bg-yellow-900/10 text-center">
              <div className="text-2xl font-bold text-yellow-400">{networkStats.trusted}</div>
              <div className="text-sm text-gray-400">Trusted</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {error && (
        <Alert className="border-red-500/30 bg-red-900/10">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!isSupported && (
        <Alert className="border-yellow-500/30 bg-yellow-900/10">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-yellow-400">
            Web Bluetooth API is not supported. Please use Chrome, Edge, or Opera with HTTPS enabled.
          </AlertDescription>
        </Alert>
      )}

      {/* Device Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Devices */}
        <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-blue-900/10">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Recent Devices ({recentDevices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentDevices.length === 0 ? (
              <div className="text-center py-6">
                <Bluetooth className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {isScanning 
                    ? "Scanning for devices..." 
                    : "No devices found. Start scanning to discover nearby Bluetooth devices."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDevices.map((device) => (
                  <div
                    key={device.id}
                    className="p-4 border border-cyan-500/20 rounded-lg bg-cyan-900/10 hover:bg-cyan-900/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getDeviceStatusIcon(device)}
                        <div>
                          <h4 className="font-medium text-white">{device.name}</h4>
                          <p className="text-xs text-gray-400 font-mono">{device.id.slice(0, 16)}...</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right mr-2">
                          <Badge 
                            variant={device.connected ? "default" : "secondary"}
                            className={cn(
                              "text-xs mb-1",
                              device.connected 
                                ? "bg-green-600 text-white" 
                                : "bg-gray-600 text-gray-300"
                            )}
                          >
                            {device.connected ? 'Connected' : 'Available'}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {getDeviceAge(device.lastSeen)}
                          </p>
                        </div>
                        {device.connected ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisconnect(device.id)}
                            className="border-red-500/50 text-red-400 hover:bg-red-900/20"
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConnect(device.id)}
                            className="border-green-500/50 text-green-400 hover:bg-green-900/20"
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                    {device.services && device.services.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-cyan-500/20">
                        <p className="text-xs text-gray-400">
                          Services: {device.services.length} available
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mesh Capable Devices */}
        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/10">
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Mesh Network Nodes ({meshDevices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meshDevices.length === 0 ? (
              <div className="text-center py-6">
                <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  No mesh-capable devices detected. Mesh nodes will appear here when discovered.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {meshDevices.map((device) => (
                  <div
                    key={device.id}
                    className="p-4 border border-purple-500/20 rounded-lg bg-purple-900/10 hover:bg-purple-900/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-purple-400" />
                        <div>
                          <h4 className="font-medium text-white">{device.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className="text-xs bg-purple-600 text-white">Mesh Node</Badge>
                            {device.authenticated && (
                              <Badge className="text-xs bg-green-600 text-white">Trusted</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-purple-400 mb-1">
                          <Signal className="w-3 h-3" />
                          <span className="text-xs">Strong</span>
                        </div>
                        <p className="text-xs text-gray-500">{getDeviceAge(device.lastSeen)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Offline Data Display */}
      {!isOnline && offlineData.users.length > 0 && (
        <Card className="border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-red-900/10">
          <CardHeader>
            <CardTitle className="text-orange-400 flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              Offline Mode - Cached Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              Currently offline. Showing {offlineData.users.length} cached users and {offlineData.stories.length} cached stories.
              Data will sync when connection is restored.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-orange-400">{offlineData.users.length}</div>
                <div className="text-sm text-gray-400">Cached Users</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-400">{offlineData.messages.length}</div>
                <div className="text-sm text-gray-400">Cached Messages</div>
              </div>
              <div>
                <div className="text-xl font-bold text-orange-400">{offlineData.stories.length}</div>
                <div className="text-sm text-gray-400">Cached Stories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}