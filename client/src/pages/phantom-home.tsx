import { useState } from 'react';
import { CipherAuth } from '@/components/cipher-auth';
import { PhantomNavigator } from '@/components/phantom-navigator';
import { NeuralInterface } from '@/components/neural-interface';
import { QuantumTerminal } from '@/components/quantum-terminal';
import { CipherProfile } from '@/components/cipher-profile';
import { PhantomLink } from '@/components/phantom-link';
import { useSimpleWebRTC } from '@/hooks/use-simple-webrtc';
import { useAdvancedMesh } from '@/hooks/use-advanced-mesh';
import type { User } from '@shared/schema';

export default function PhantomHome() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('neural');
  const { isConnected } = useSimpleWebRTC(currentUser?.id.toString() || 'guest');
  const meshHook = useAdvancedMesh(currentUser?.meshCallsign || 'guest');

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
          <div className="w-full max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Cipher Vault Security Center
              </h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Advanced cryptographic key management and security protocols</p>
            </div>
            {/* Placeholder for security features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              <div className="p-3 sm:p-4 lg:p-6 border border-cyan-500/30 rounded-lg bg-cyan-900/10 text-center">
                <h3 className="text-lg sm:text-xl font-bold text-cyan-400 mb-2">Quantum Encryption</h3>
                <p className="text-gray-400 text-sm sm:text-base">AES-256-GCM with quantum-resistant algorithms</p>
              </div>
              <div className="p-3 sm:p-4 lg:p-6 border border-purple-500/30 rounded-lg bg-purple-900/10 text-center">
                <h3 className="text-lg sm:text-xl font-bold text-purple-400 mb-2">Neural Firewall</h3>
                <p className="text-gray-400 text-sm sm:text-base">AI-powered threat detection and prevention</p>
              </div>
              <div className="p-3 sm:p-4 lg:p-6 border border-green-500/30 rounded-lg bg-green-900/10 text-center">
                <h3 className="text-lg sm:text-xl font-bold text-green-400 mb-2">Void Protocol</h3>
                <p className="text-gray-400 text-sm sm:text-base">Anonymous routing through mesh network</p>
              </div>
            </div>
          </div>
        );
      case 'phantom':
        return (
          <PhantomLink 
            nodeId={currentUser.id.toString()}
            onDeviceConnect={(device) => console.log('Device connected:', device)}
            onDeviceDisconnect={(deviceId) => console.log('Device disconnected:', deviceId)}
          />
        );
      case 'void':
        return (
          <div className="w-full max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Void Analytics Network
              </h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Real-time mesh network performance monitoring and analytics</p>
            </div>
            {/* Placeholder for analytics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 border border-pink-500/30 rounded-lg bg-pink-900/10 text-center">
                <div className="text-2xl font-bold text-pink-400">
                  {meshHook.networkMetrics?.currentStatus?.activeNodes || 0}
                </div>
                <div className="text-sm text-gray-400">Active Nodes</div>
              </div>
              <div className="p-4 border border-purple-500/30 rounded-lg bg-purple-900/10 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {Math.round(meshHook.networkMetrics?.currentStatus?.averageLatency || 0)}ms
                </div>
                <div className="text-sm text-gray-400">Avg Latency</div>
              </div>
              <div className="p-4 border border-cyan-500/30 rounded-lg bg-cyan-900/10 text-center">
                <div className="text-2xl font-bold text-cyan-400">
                  {Math.round(meshHook.networkMetrics?.currentStatus?.bandwidth || 0)}
                </div>
                <div className="text-sm text-gray-400">Bandwidth</div>
              </div>
              <div className="p-4 border border-green-500/30 rounded-lg bg-green-900/10 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {meshHook.networkMetrics?.currentStatus?.networkHealth || 'Unknown'}
                </div>
                <div className="text-sm text-gray-400">Network Health</div>
              </div>
            </div>
          </div>
        );
      case 'nexus':
        return (
          <CipherProfile 
            user={currentUser}
            onProfileUpdate={handleProfileUpdate}
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