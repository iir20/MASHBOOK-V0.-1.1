import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Pause, Users, Bluetooth, Signal, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealDetectedDevice {
  id: string;
  name: string;
  connected: boolean;
  lastSeen: number;
  rssi?: number; // Signal strength
  deviceClass?: number;
}

interface RealBluetoothScannerProps {
  onDeviceDetected: (device: RealDetectedDevice) => void;
  onScanStateChange: (isScanning: boolean) => void;
  className?: string;
}

export function RealBluetoothScanner({ onDeviceDetected, onScanStateChange, className }: RealBluetoothScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [detectedDevices, setDetectedDevices] = useState<RealDetectedDevice[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const scannerRef = useRef<HTMLDivElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check Web Bluetooth API support
  useEffect(() => {
    const checkSupport = async () => {
      if (!navigator.bluetooth) {
        setError('Web Bluetooth API is not supported in this browser');
        setIsSupported(false);
        return;
      }

      try {
        const available = await navigator.bluetooth.getAvailability();
        setIsSupported(available);
        if (!available) {
          setError('Bluetooth is not available on this device');
        }
      } catch (err) {
        setError('Failed to check Bluetooth availability');
        setIsSupported(false);
      }
    };

    checkSupport();

    // Listen for bluetooth availability changes
    if (navigator.bluetooth && 'addEventListener' in navigator.bluetooth) {
      const handleAvailabilityChange = (event: any) => {
        setIsSupported(event.value);
        if (!event.value) {
          setError('Bluetooth became unavailable');
          stopScanning();
        }
      };

      navigator.bluetooth.addEventListener('availabilitychanged', handleAvailabilityChange);
      return () => {
        navigator.bluetooth?.removeEventListener?.('availabilitychanged', handleAvailabilityChange);
      };
    }
  }, []);

  // Real Bluetooth device scanning
  const performBluetoothScan = useCallback(async () => {
    if (!navigator.bluetooth || !isSupported) {
      setError('Bluetooth not supported or available');
      return;
    }

    try {
      setError(null);
      
      // Request device with broad filters
      const device = await navigator.bluetooth.requestDevice({
        // Accept all devices to discover nearby Bluetooth devices
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'device_information',
          'generic_access',
          'generic_attribute'
        ]
      });

      if (device) {
        const newDevice: RealDetectedDevice = {
          id: device.id || `device_${Date.now()}`,
          name: device.name || 'Unknown Device',
          connected: device.gatt?.connected || false,
          lastSeen: Date.now(),
          rssi: undefined, // Web Bluetooth API doesn't provide RSSI directly
          deviceClass: undefined
        };

        setDetectedDevices(prev => {
          const existingIndex = prev.findIndex(d => d.id === newDevice.id);
          if (existingIndex >= 0) {
            // Update existing device
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], lastSeen: Date.now() };
            return updated;
          } else {
            // Add new device
            onDeviceDetected(newDevice);
            return [...prev, newDevice];
          }
        });

        // Try to get additional device information
        if (device.gatt && !device.gatt.connected) {
          try {
            await device.gatt.connect();
            console.log(`Connected to device: ${device.name}`);
            
            // Update connection status
            setDetectedDevices(prev => 
              prev.map(d => 
                d.id === newDevice.id 
                  ? { ...d, connected: true }
                  : d
              )
            );
            
            // Disconnect after getting info to avoid keeping connections
            setTimeout(() => {
              device.gatt?.disconnect();
            }, 1000);
            
          } catch (connectError) {
            console.log('Could not connect to device for additional info:', connectError);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        console.log('No device selected by user');
      } else if (err.name === 'SecurityError') {
        setError('Bluetooth access denied. Please allow Bluetooth permissions.');
      } else {
        setError(`Bluetooth scan error: ${err.message || 'Unknown error'}`);
        console.error('Bluetooth scan error:', err);
      }
    }
  }, [isSupported, onDeviceDetected]);

  const startScanning = useCallback(async () => {
    if (!isSupported) {
      setError('Bluetooth is not supported or available');
      return;
    }

    setIsScanning(true);
    setError(null);
    setScanProgress(0);
    onScanStateChange(true);

    // Immediate scan
    await performBluetoothScan();

    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      setScanProgress(prev => (prev + 1) % 100);
    }, 100);

    // Periodic scans every 10 seconds
    scanIntervalRef.current = setInterval(() => {
      performBluetoothScan();
    }, 10000);

    // Auto-stop after 60 seconds to prevent excessive scanning
    setTimeout(() => {
      if (isScanning) {
        stopScanning();
      }
    }, 60000);
  }, [isSupported, performBluetoothScan, onScanStateChange, isScanning]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    setScanProgress(0);
    onScanStateChange(false);

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, [onScanStateChange]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const toggleScanning = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  const getDeviceIcon = (device: RealDetectedDevice) => {
    return device.connected ? 'text-green-400' : 'text-blue-400';
  };

  const getDeviceAge = (lastSeen: number) => {
    const seconds = Math.floor((Date.now() - lastSeen) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Filter recent devices (last 5 minutes)
  const recentDevices = detectedDevices.filter(device => 
    Date.now() - device.lastSeen < 5 * 60 * 1000
  );

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
      <Card className="border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-purple-900/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bluetooth className="w-8 h-8 text-blue-400" />
                {isScanning && (
                  <div className="absolute -inset-1 rounded-full border-2 border-blue-400 animate-pulse" />
                )}
              </div>
              <div>
                <CardTitle className="text-blue-400">Real Bluetooth Scanner</CardTitle>
                <p className="text-gray-400 text-sm">
                  {isSupported ? 'Discover nearby Bluetooth devices' : 'Bluetooth not available'}
                </p>
              </div>
            </div>
            <Button
              onClick={toggleScanning}
              disabled={!isSupported}
              className={cn(
                "min-w-[120px]",
                isScanning 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              {isScanning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Scan
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Scan
                </>
              )}
            </Button>
          </div>
          
          {isScanning && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Scanning for devices...</span>
                <span>{Math.floor(scanProgress)}% complete</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-500/30 bg-red-900/10">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!isSupported && (
            <Alert className="mb-4 border-yellow-500/30 bg-yellow-900/10">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-yellow-400">
                Web Bluetooth API is not supported in this browser. Try using Chrome, Edge, or Opera with HTTPS enabled.
              </AlertDescription>
            </Alert>
          )}

          {/* Detected Devices */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-400" />
                Detected Devices ({recentDevices.length})
              </h3>
            </div>

            {recentDevices.length === 0 ? (
              <div className="text-center py-8">
                <Bluetooth className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {isScanning 
                    ? "Scanning for Bluetooth devices..." 
                    : "No devices detected. Start scanning to discover nearby Bluetooth devices."
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentDevices.map((device) => (
                  <div
                    key={device.id}
                    className="p-4 border border-blue-500/20 rounded-lg bg-blue-900/10 hover:bg-blue-900/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bluetooth className={cn("w-5 h-5", getDeviceIcon(device))} />
                        <div>
                          <h4 className="font-medium text-white">{device.name}</h4>
                          <p className="text-xs text-gray-400">{device.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={device.connected ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            device.connected 
                              ? "bg-green-600 text-white" 
                              : "bg-gray-600 text-gray-300"
                          )}
                        >
                          {device.connected ? 'Connected' : 'Available'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{getDeviceAge(device.lastSeen)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}