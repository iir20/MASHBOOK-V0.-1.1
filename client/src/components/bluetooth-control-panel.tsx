import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBluetoothMesh } from '@/hooks/use-bluetooth-mesh';
import { 
  Bluetooth, 
  BluetoothConnected, 
  BluetoothSearching, 
  Power, 
  Scan,
  Signal,
  Shield,
  Zap,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface BluetoothControlPanelProps {
  userId: string;
}

export function BluetoothControlPanel({ userId }: BluetoothControlPanelProps) {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  
  const {
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
    clearError
  } = useBluetoothMesh(userId);

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const handleConnect = async () => {
    if (selectedDevice) {
      await connectToDevice(selectedDevice);
    }
  };

  const handleDisconnect = async () => {
    if (selectedDevice) {
      await disconnectFromDevice(selectedDevice);
    }
  };

  const handleSendTestMessage = async () => {
    if (selectedDevice) {
      await sendMessage('Test message from MeshBook', selectedDevice);
    }
  };

  const handleBroadcastMessage = async () => {
    await broadcastMessage('Broadcasting from MeshBook to all nodes');
  };

  const getConnectionTypeColor = (device: any) => {
    if (device.isConnected) return 'var(--cyber-green)';
    if (device.meshRole === 'relay') return 'var(--cyber-magenta)';
    return 'var(--cyber-cyan)';
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      {/* Header */}
      <Card className="p-4 glass-morphism">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isInitialized ? 'bg-[var(--cyber-green)]/20' : 'bg-[var(--cyber-red)]/20'
            }`}>
              <BluetoothConnected className={`w-6 h-6 ${
                isInitialized ? 'text-[var(--cyber-green)]' : 'text-[var(--cyber-red)]'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--cyber-cyan)]">Bluetooth Mesh Control</h2>
              <p className="text-sm text-gray-400">
                {isInitialized ? 'Mesh network active' : 'Initializing...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={isScanning ? stopScanning : startScanning}
              className="neon-button"
            >
              {isScanning ? <BluetoothSearching className="w-4 h-4 mr-2" /> : <Scan className="w-4 h-4 mr-2" />}
              {isScanning ? 'Stop Scan' : 'Start Scan'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-[var(--cyber-red)]/20 border-[var(--cyber-red)]/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-[var(--cyber-red)]" />
              <span className="text-[var(--cyber-red)]">{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="text-[var(--cyber-red)] hover:text-white"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Network Stats */}
      <Card className="p-4 glass-morphism">
        <h3 className="text-lg font-semibold text-[var(--cyber-cyan)] mb-3">Network Statistics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--cyber-green)]">
              {networkStats.connectedDevices}
            </div>
            <div className="text-xs text-gray-400">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--cyber-cyan)]">
              {networkStats.totalDevices}
            </div>
            <div className="text-xs text-gray-400">Discovered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--cyber-magenta)]">
              {networkStats.routingEntries}
            </div>
            <div className="text-xs text-gray-400">Routes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--cyber-yellow)]">
              {networkStats.messageBufferSize}
            </div>
            <div className="text-xs text-gray-400">Buffered</div>
          </div>
        </div>
      </Card>

      {/* Device List */}
      <Card className="p-4 glass-morphism">
        <h3 className="text-lg font-semibold text-[var(--cyber-cyan)] mb-3">Discovered Devices</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                selectedDevice === device.id
                  ? 'border-[var(--cyber-cyan)] bg-[var(--cyber-cyan)]/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => handleDeviceSelect(device.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: getConnectionTypeColor(device),
                      boxShadow: `0 0 8px ${getConnectionTypeColor(device)}`
                    }}
                  />
                  <div>
                    <div className="font-medium">{device.name}</div>
                    <div className="text-sm text-gray-400 font-mono">{device.address}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {device.meshRole}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Signal className="w-3 h-3 text-[var(--cyber-cyan)]" />
                    <span className="text-xs text-gray-400">{device.rssi}dBm</span>
                  </div>
                  {device.isConnected && (
                    <CheckCircle className="w-4 h-4 text-[var(--cyber-green)]" />
                  )}
                </div>
              </div>
              
              {device.capabilities && (
                <div className="mt-2 flex items-center space-x-2 text-xs text-gray-400">
                  <span>Max Connections: {device.capabilities.maxConnections}</span>
                  {device.capabilities.canRelay && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      Relay
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Device Control */}
      {selectedDevice && (
        <Card className="p-4 glass-morphism">
          <h3 className="text-lg font-semibold text-[var(--cyber-cyan)] mb-3">Device Control</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleConnect}
              disabled={devices.find(d => d.id === selectedDevice)?.isConnected}
              className="neon-button"
            >
              <BluetoothConnected className="w-4 h-4 mr-2" />
              Connect
            </Button>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={!devices.find(d => d.id === selectedDevice)?.isConnected}
              className="neon-button"
            >
              <Power className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
            <Button
              variant="outline"
              onClick={handleSendTestMessage}
              disabled={!devices.find(d => d.id === selectedDevice)?.isConnected}
              className="neon-button"
            >
              <Signal className="w-4 h-4 mr-2" />
              Send Test
            </Button>
            <Button
              variant="outline"
              onClick={handleBroadcastMessage}
              disabled={connectedDevices.length === 0}
              className="neon-button"
            >
              <Activity className="w-4 h-4 mr-2" />
              Broadcast
            </Button>
          </div>
        </Card>
      )}

      {/* Recent Messages */}
      {messages.length > 0 && (
        <Card className="p-4 glass-morphism">
          <h3 className="text-lg font-semibold text-[var(--cyber-cyan)] mb-3">Recent Mesh Messages</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {messages.slice(-5).map((message) => (
              <div key={message.id} className="p-2 bg-[var(--cyber-dark)]/50 rounded border border-gray-600">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>{message.sourceId}</span>
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                </div>
                <div className="text-sm">{message.content}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {message.type}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    Hops: {message.hopCount} | TTL: {message.ttl}
                  </span>
                  {message.encrypted && (
                    <Shield className="w-3 h-3 text-[var(--cyber-green)]" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}