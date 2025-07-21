import { useState } from 'react';
import { CipherAuth } from '@/components/cipher-auth';
import { PhantomNavigator } from '@/components/phantom-navigator';
import { NeuralInterface } from '@/components/neural-interface';
import { QuantumTerminal } from '@/components/quantum-terminal';
import { RealCipherProfile } from '@/components/real-cipher-profile';
import { RealStoriesManager } from '@/components/real-stories-manager';
import { EnhancedRealBluetoothScanner } from '@/components/enhanced-real-bluetooth-scanner';
import { RealCipherVault } from '@/components/real-cipher-vault';
import { RealNetworkMonitor } from '@/components/real-network-monitor';
import { PhantomLink } from '@/components/phantom-link';
import { useSimpleWebRTC } from '@/hooks/use-simple-webrtc';
import { useAdvancedMesh } from '@/hooks/use-advanced-mesh';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import type { User } from '@shared/schema';

export default function PhantomHome() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('neural');
  const { isConnected } = useSimpleWebRTC(currentUser?.id.toString() || 'guest');
  const meshHook = useAdvancedMesh(currentUser?.meshCallsign || 'guest');
  const offlineStorage = useOfflineStorage();

  const handleUserAuthenticated = (user: User, userDeviceId: string) => {
    setCurrentUser(user);
    setDeviceId(userDeviceId);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  // Available target nodes for quantum terminal
  const targetNodes = [
    'PHANTOM-α',
    'GHOST-β',
    'CIPHER-γ',
    'SHADOW-δ',
    'VOID-ε',
    'NEURAL-ζ'
  ];

  // Show authentication if no user is logged in
  if (!currentUser) {
    return <CipherAuth onUserAuthenticated={handleUserAuthenticated} />;
  }

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'neural':
        return (
          <NeuralInterface 
            userId={currentUser.id.toString()}
            onNodeSelect={(nodeId) => console.log('Selected node:', nodeId)}
          />
        );
      case 'quantum':
        return (
          <QuantumTerminal 
            nodeCallsign={currentUser.meshCallsign}
            targetNodes={targetNodes}
            onMessageSent={(message) => console.log('Message sent:', message)}
          />
        );
      case 'cipher':
        return (
          <RealCipherVault 
            user={currentUser}
          />
        );
      case 'phantom':
        return (
          <EnhancedRealBluetoothScanner 
            onDeviceDetected={(device) => console.log('Real device detected:', device)}
            onScanStateChange={(isScanning) => console.log('Scan state:', isScanning)}
          />
        );
      case 'void':
        return (
          <RealNetworkMonitor />
        );
      case 'nexus':
        return (
          <RealCipherProfile 
            user={currentUser}
            onProfileUpdate={handleProfileUpdate}
          />
        );
      case 'stories':
        return (
          <RealStoriesManager 
            userId={currentUser.id}
            currentUser={currentUser}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="flex flex-col h-screen">
          {/* Main Content (Mobile) */}
          <div className="flex-1 overflow-y-auto">
            {renderActiveContent()}
          </div>
          
          {/* Navigation (Mobile Bottom) */}
          <div className="border-t border-gray-700 bg-black/80 backdrop-blur-sm">
            <PhantomNavigator 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              isConnected={isConnected}
              nodeCount={meshHook.networkMetrics?.currentStatus?.activeNodes || 0}
              userCallsign={currentUser.meshCallsign}
            />
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen">
        {/* Navigation (Desktop Sidebar) */}
        <PhantomNavigator 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isConnected={isConnected}
          nodeCount={meshHook.networkMetrics?.currentStatus?.activeNodes || 0}
          userCallsign={currentUser.meshCallsign}
        />

        {/* Main Content (Desktop) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {renderActiveContent()}
          </main>
        </div>
      </div>
    </div>
  );
}