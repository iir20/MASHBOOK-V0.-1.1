export class BluetoothManager {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristics: Map<string, BluetoothRemoteGATTCharacteristic> = new Map();

  async isBluetoothSupported(): Promise<boolean> {
    return 'bluetooth' in navigator;
  }

  async requestDevice(): Promise<BluetoothDevice> {
    if (!await this.isBluetoothSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information']
      });

      this.device = device;
      return device;
    } catch (error) {
      console.error('Failed to request Bluetooth device:', error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    if (!this.device) {
      throw new Error('No device selected');
    }

    try {
      this.server = await this.device.gatt?.connect();
      console.log('Connected to GATT server');
    } catch (error) {
      console.error('Failed to connect to GATT server:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.server) {
      this.server.disconnect();
      this.server = null;
      console.log('Disconnected from GATT server');
    }
  }

  async discoverServices(): Promise<BluetoothRemoteGATTService[]> {
    if (!this.server) {
      throw new Error('Not connected to GATT server');
    }

    try {
      const services = await this.server.getPrimaryServices();
      console.log('Discovered services:', services);
      return services;
    } catch (error) {
      console.error('Failed to discover services:', error);
      throw error;
    }
  }

  async getCharacteristic(serviceUuid: string, characteristicUuid: string): Promise<BluetoothRemoteGATTCharacteristic> {
    if (!this.server) {
      throw new Error('Not connected to GATT server');
    }

    try {
      const service = await this.server.getPrimaryService(serviceUuid);
      const characteristic = await service.getCharacteristic(characteristicUuid);
      
      this.characteristics.set(characteristicUuid, characteristic);
      return characteristic;
    } catch (error) {
      console.error('Failed to get characteristic:', error);
      throw error;
    }
  }

  async writeValue(characteristicUuid: string, value: ArrayBuffer): Promise<void> {
    const characteristic = this.characteristics.get(characteristicUuid);
    if (!characteristic) {
      throw new Error(`Characteristic ${characteristicUuid} not found`);
    }

    try {
      await characteristic.writeValue(value);
    } catch (error) {
      console.error('Failed to write value:', error);
      throw error;
    }
  }

  async readValue(characteristicUuid: string): Promise<DataView> {
    const characteristic = this.characteristics.get(characteristicUuid);
    if (!characteristic) {
      throw new Error(`Characteristic ${characteristicUuid} not found`);
    }

    try {
      return await characteristic.readValue();
    } catch (error) {
      console.error('Failed to read value:', error);
      throw error;
    }
  }

  async sendMessage(message: string): Promise<void> {
    // This would typically write to a custom messaging characteristic
    // For now, we'll simulate message sending
    console.log('Sending Bluetooth message:', message);
    
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    
    // In a real implementation, you would write to a specific characteristic
    // await this.writeValue('messaging_characteristic_uuid', data.buffer);
  }

  onMessage?: (message: string) => void;
  onDeviceDisconnected?: () => void;

  private setupEventListeners(): void {
    if (this.device) {
      this.device.addEventListener('gattserverdisconnected', () => {
        console.log('Device disconnected');
        this.onDeviceDisconnected?.();
      });
    }
  }

  isConnected(): boolean {
    return this.server?.connected ?? false;
  }

  getDevice(): BluetoothDevice | null {
    return this.device;
  }
}
