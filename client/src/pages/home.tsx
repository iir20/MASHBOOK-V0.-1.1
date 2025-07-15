import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AuthManager } from '@/components/auth-manager';
import { UserProfile } from '@/components/user-profile';
import { EnhancedScanner } from '@/components/enhanced-scanner';
import { ModernChat } from '@/components/modern-chat';
import { Sidebar } from '@/components/sidebar';
import { NetworkAnalyticsDashboard } from '@/components/network-analytics-dashboard';
import { FileTransferManager } from '@/components/file-transfer-manager';
import { SecurityMonitor } from '@/components/security-monitor';
import { NetworkExplorer } from '@/components/network-explorer';
import { StoriesManager } from '@/components/stories-manager';
import { BluetoothManager } from '@/components/bluetooth-manager';
import { useSimpleWebRTC } from '@/hooks/use-simple-webrtc';
import { useAdvancedMesh } from '@/hooks/use-advanced-mesh';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import type { User } from '@shared/schema';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [showProfile, setShowProfile] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { isConnected } = useSimpleWebRTC();
  const meshHook = useAdvancedMesh(currentUser?.id.toString() || 'guest');
  const { storeMessage } = useOfflineStorage();

  const handleUserAuthenticated = (user: User, userDeviceId: string) => {
    setCurrentUser(user);
    setDeviceId(userDeviceId);
  };

  const handleUserDetected = (detectedUser: any) => {
    // Store detected user for future mesh networking
    console.log('User detected:', detectedUser);
    
    // Could store this in local storage or send to server for mesh topology
    storeMessage({
      id: `detection_${Date.now()}`,
      content: `User ${detectedUser.username} detected at ${detectedUser.distance}m`,
      fromUserId: currentUser?.id || 0,
      timestamp: new Date(),
      messageType: 'system'
    });
  };

  // Show authentication if no user is logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
        <AuthManager onUserAuthenticated={handleUserAuthenticated} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          isConnected={isConnected}
          connectionCount={meshHook?.networkMetrics?.networkStats?.totalNodes || 0}
        />
        
        {/* Main Content */}
        <main className="flex-1 flex lg:ml-0 ml-0">
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col lg:flex-row relative">
              <div className="flex-1 min-h-0 lg:min-h-0">
                <ModernChat
                  currentUser={currentUser}
                  selectedUserId={selectedUserId > 0 ? selectedUserId : undefined}
                  onUserSelect={setSelectedUserId}
                  className="h-full"
                />
              </div>
              
              {/* Mobile-friendly right panel */}
              <div className={`
                lg:w-80 w-full lg:border-l border-[var(--cyber-cyan)]/30 
                ${selectedUserId > 0 ? 'hidden lg:flex' : 'flex lg:flex'}
                flex-col
                lg:h-full h-auto
                ${selectedUserId > 0 ? 'lg:relative absolute inset-0 z-20 bg-[var(--cyber-dark)]' : ''}
              `}>
                {/* User Profile Section */}
                <div className="p-4 border-b border-[var(--cyber-cyan)]/30 bg-[var(--cyber-dark)]/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 bg-gradient-to-br from-[var(--cyber-cyan)] to-[var(--cyber-magenta)] rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => setShowProfile(!showProfile)}
                    >
                      <span className="text-white font-bold">{currentUser.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{currentUser.username}</p>
                      <p className="text-xs text-[var(--cyber-cyan)]">
                        {isConnected ? 'Connected' : 'Connecting...'}
                      </p>
                    </div>
                    {/* Mobile back button when chat is selected */}
                    {selectedUserId > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedUserId(0)}
                        className="lg:hidden text-gray-400 hover:text-white"
                      >
                        Back
                      </Button>
                    )}
                  </div>
                </div>

                {/* Profile Modal */}
                {showProfile && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <UserProfile
                      userId={currentUser.id}
                      deviceId={deviceId}
                      onClose={() => setShowProfile(false)}
                    />
                  </div>
                )}

                {/* Scanner Section */}
                <div className="flex-1 min-h-0 p-4 overflow-hidden">
                  <EnhancedScanner
                    onUserDetected={handleUserDetected}
                    onScanStateChange={setIsScanning}
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="flex-1 p-4 lg:p-6">
              <NetworkAnalyticsDashboard />
            </div>
          )}
          
          {activeTab === 'transfers' && (
            <div className="flex-1 p-4 lg:p-6">
              <FileTransferManager 
                nodeId={currentUser?.id.toString() || 'guest'}
                availableNodes={meshHook?.networkMetrics?.connectedUsers || []}
              />
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="flex-1 p-4 lg:p-6">
              <SecurityMonitor nodeId={currentUser?.id.toString() || 'guest'} />
            </div>
          )}
          
          {activeTab === 'network' && (
            <div className="flex-1 p-4 lg:p-6">
              <NetworkExplorer nodeId={currentUser?.id.toString() || 'guest'} />
            </div>
          )}
          
          {activeTab === 'stories' && (
            <div className="flex-1 p-4 lg:p-6">
              <StoriesManager 
                userId={currentUser?.id || 0}
                currentUser={currentUser}
              />
            </div>
          )}
          
          {activeTab === 'bluetooth' && (
            <div className="flex-1 p-4 lg:p-6">
              <BluetoothManager nodeId={currentUser?.id.toString() || 'guest'} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}