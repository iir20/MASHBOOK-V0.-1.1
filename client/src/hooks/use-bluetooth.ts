import { useState, useEffect } from 'react';
import { BluetoothDevice } from '@/types/mesh';

export function useBluetooth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);

  useEffect(() => {
    // Check if Web Bluetooth is supported
    setIsSupported('bluetooth' in navigator);
  }, []);

  const requestDevice = async () => {
    if (!isSupported) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    try {
      setIsScanning(true);
      
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      const bluetoothDevice: BluetoothDevice = {
        id: device.id,
        name: device.name || 'Unknown Device',
        rssi: -50 + Math.random() * 40, // Mock RSSI value
        isConnected: false
      };

      setDevices(prev => {
        const existing = prev.find(d => d.id === bluetoothDevice.id);
        if (existing) {
          return prev;
        }
        return [...prev, bluetoothDevice];
      });

      return bluetoothDevice;
    } catch (error) {
      console.error('Bluetooth device request failed:', error);
      throw error;
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      // In a real implementation, this would connect to the GATT server
      // For now, we'll simulate a connection
      setConnectedDevice({ ...device, isConnected: true });
      
      setDevices(prev => 
        prev.map(d => 
          d.id === device.id 
            ? { ...d, isConnected: true }
            : d
        )
      );
      
      return true;
    } catch (error) {
      console.error('Failed to connect to device:', error);
      return false;
    }
  };

  const disconnectDevice = async (device: BluetoothDevice) => {
    try {
      if (connectedDevice?.id === device.id) {
        setConnectedDevice(null);
      }
      
      setDevices(prev => 
        prev.map(d => 
          d.id === device.id 
            ? { ...d, isConnected: false }
            : d
        )
      );
      
      return true;
    } catch (error) {
      console.error('Failed to disconnect device:', error);
      return false;
    }
  };

  const sendMessage = async (message: string) => {
    if (!connectedDevice) {
      throw new Error('No device connected');
    }
    
    // In a real implementation, this would send data via GATT characteristic
    console.log('Sending message via Bluetooth:', message);
    return true;
  };

  const scanForDevices = async () => {
    if (!isSupported) {
      throw new Error('Web Bluetooth is not supported');
    }

    // Mock device discovery since we can't scan without user interaction
    const mockDevices: BluetoothDevice[] = [
      { id: 'device1', name: 'CyberNode_A1', rssi: -45, isConnected: false },
      { id: 'device2', name: 'MeshRelay_B7', rssi: -60, isConnected: false },
      { id: 'device3', name: 'NetRunner_X9', rssi: -35, isConnected: false }
    ];

    setDevices(mockDevices);
    return mockDevices;
  };

  return {
    isSupported,
    isScanning,
    devices,
    connectedDevice,
    requestDevice,
    connectToDevice,
    disconnectDevice,
    sendMessage,
    scanForDevices,
  };
}
