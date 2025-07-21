import { useState, useEffect, useCallback, useRef } from 'react';

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  connected: boolean;
  lastSeen: number;
  rssi?: number;
  deviceClass?: number;
  services?: string[];
  authenticated?: boolean;
  meshCapable?: boolean;
}

export interface BluetoothScanResult {
  devices: BluetoothDeviceInfo[];
  isScanning: boolean;
  isSupported: boolean;
  error: string | null;
}

export function useRealBluetooth() {
  const [devices, setDevices] = useState<BluetoothDeviceInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<Set<string>>(new Set());
  
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectedDevicesRef = useRef<Map<string, BluetoothDeviceInfo>>(new Map());

  // Check Web Bluetooth support and availability
  useEffect(() => {
    const checkSupport = async () => {
      if (!navigator.bluetooth) {
        setError('Web Bluetooth API not supported in this browser');
        setIsSupported(false);
        return;
      }

      try {
        const available = await navigator.bluetooth.getAvailability();
        setIsSupported(available);
        
        if (!available) {
          setError('Bluetooth is not available on this device');
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Bluetooth availability check failed:', err);
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
          stopScan();
        } else {
          setError(null);
        }
      };

      navigator.bluetooth.addEventListener('availabilitychanged', handleAvailabilityChange);
      
      return () => {
        navigator.bluetooth?.removeEventListener?.('availabilitychanged', handleAvailabilityChange);
      };
    }
  }, []);

  // Real Bluetooth device scanning
  const scanForDevices = useCallback(async (): Promise<BluetoothDeviceInfo | null> => {
    if (!navigator.bluetooth || !isSupported) {
      throw new Error('Bluetooth not supported or available');
    }

    try {
      setError(null);
      
      // Request device with mesh network services
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          'battery_service',
          'device_information',
          'generic_access',
          'generic_attribute',
          '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
          '0000180a-0000-1000-8000-00805f9b34fb', // Device Information
          // Custom mesh services (if implemented)
          '12345678-1234-1234-1234-123456789abc'  // Custom mesh service UUID
        ]
      });

      if (!device) return null;

      const bluetoothDevice: BluetoothDeviceInfo = {
        id: device.id || `bt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: device.name || 'Unknown Device',
        connected: false,
        lastSeen: Date.now(),
        services: [],
        authenticated: false,
        meshCapable: false
      };

      // Try to connect and get additional information
      if (device.gatt) {
        try {
          const server = await device.gatt.connect();
          bluetoothDevice.connected = true;
          
          // Get available services
          const services = await server.getPrimaryServices();
          bluetoothDevice.services = services.map(service => service.uuid);
          
          // Check if device supports mesh networking
          bluetoothDevice.meshCapable = services.some(service => 
            service.uuid.includes('12345678-1234') || // Custom mesh service
            bluetoothDevice.name?.toLowerCase().includes('mesh') ||
            bluetoothDevice.name?.toLowerCase().includes('meshbook')
          );

          // Store connection reference
          connectedDevicesRef.current.set(bluetoothDevice.id, bluetoothDevice);
          setConnectedDevices(prev => new Set([...prev, bluetoothDevice.id]));

          // Listen for disconnection
          device.addEventListener('gattserverdisconnected', () => {
            connectedDevicesRef.current.delete(bluetoothDevice.id);
            setConnectedDevices(prev => {
              const newSet = new Set(prev);
              newSet.delete(bluetoothDevice.id);
              return newSet;
            });
            
            setDevices(prev => prev.map(d => 
              d.id === bluetoothDevice.id 
                ? { ...d, connected: false, lastSeen: Date.now() }
                : d
            ));
          });

          // Disconnect after getting info to avoid keeping unnecessary connections
          setTimeout(() => {
            if (server.connected) {
              server.disconnect();
            }
          }, 2000);

        } catch (connectError) {
          console.log('Could not connect to device:', connectError);
          bluetoothDevice.connected = false;
        }
      }

      return bluetoothDevice;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        // User canceled device selection
        return null;
      } else if (err.name === 'SecurityError') {
        throw new Error('Bluetooth access denied. Please allow Bluetooth permissions.');
      } else {
        throw new Error(`Bluetooth scan error: ${err.message || 'Unknown error'}`);
      }
    }
  }, [isSupported]);

  const startScan = useCallback(async () => {
    if (!isSupported) {
      setError('Bluetooth is not supported or available');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      // Initial scan
      const device = await scanForDevices();
      if (device) {
        setDevices(prev => {
          const existing = prev.find(d => d.id === device.id);
          if (existing) {
            return prev.map(d => d.id === device.id ? device : d);
          }
          return [...prev, device];
        });
      }
    } catch (err: any) {
      setError(err.message);
      setIsScanning(false);
      return;
    }

    // Periodic scanning every 15 seconds
    scanIntervalRef.current = setInterval(async () => {
      try {
        const device = await scanForDevices();
        if (device) {
          setDevices(prev => {
            const existing = prev.find(d => d.id === device.id);
            if (existing) {
              return prev.map(d => d.id === device.id ? device : d);
            }
            return [...prev, device];
          });
        }
      } catch (err: any) {
        console.error('Periodic scan error:', err);
      }
    }, 15000);

    // Auto-stop after 2 minutes to prevent excessive scanning
    setTimeout(() => {
      stopScan();
    }, 120000);
  }, [isSupported, scanForDevices]);

  const stopScan = useCallback(() => {
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  const connectToDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || device.connected) return false;

    try {
      // In a real implementation, you would reconnect to the stored device
      // For now, we'll update the state optimistically
      setDevices(prev => prev.map(d => 
        d.id === deviceId 
          ? { ...d, connected: true, lastSeen: Date.now() }
          : d
      ));
      
      setConnectedDevices(prev => new Set([...prev, deviceId]));
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }, [devices]);

  const disconnectFromDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    try {
      const deviceRef = connectedDevicesRef.current.get(deviceId);
      if (deviceRef) {
        // Disconnect from actual device if connected
        // In real implementation, you'd call device.gatt.disconnect()
      }

      setDevices(prev => prev.map(d => 
        d.id === deviceId 
          ? { ...d, connected: false, lastSeen: Date.now() }
          : d
      ));
      
      setConnectedDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });

      connectedDevicesRef.current.delete(deviceId);
      return true;
    } catch (error) {
      console.error('Disconnection failed:', error);
      return false;
    }
  }, []);

  const sendDataToDevice = useCallback(async (deviceId: string, data: ArrayBuffer): Promise<boolean> => {
    const device = connectedDevicesRef.current.get(deviceId);
    if (!device || !device.connected) return false;

    try {
      // In real implementation, you would write data to a characteristic
      console.log(`Sending data to device ${deviceId}:`, data);
      return true;
    } catch (error) {
      console.error('Data send failed:', error);
      return false;
    }
  }, []);

  const getRecentDevices = useCallback((maxAgeMinutes: number = 5) => {
    const cutoffTime = Date.now() - (maxAgeMinutes * 60 * 1000);
    return devices.filter(device => device.lastSeen >= cutoffTime);
  }, [devices]);

  const getMeshCapableDevices = useCallback(() => {
    return devices.filter(device => device.meshCapable);
  }, [devices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScan();
      // Disconnect all connected devices
      connectedDevicesRef.current.forEach(async (device) => {
        try {
          // In real implementation, disconnect from actual device
        } catch (error) {
          console.error('Cleanup disconnect failed:', error);
        }
      });
    };
  }, [stopScan]);

  return {
    devices,
    isScanning,
    isSupported,
    error,
    connectedDevices: Array.from(connectedDevices),
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    sendDataToDevice,
    getRecentDevices,
    getMeshCapableDevices,
    scanForDevices
  };
}