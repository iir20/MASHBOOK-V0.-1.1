import { useState, useEffect } from 'react';
import { AuthManager } from '@/components/auth-manager';
import { UserProfile } from '@/components/user-profile';
import { EnhancedScanner } from '@/components/enhanced-scanner';
import { ModernChat } from '@/components/modern-chat';
import { Sidebar } from '@/components/sidebar';
import { NetworkAnalyticsDashboard } from '@/components/network-analytics-dashboard';
import { FileTransferManager } from '@/components/file-transfer-manager';
import { SecurityMonitor } from '@/components/security-monitor';
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
          connectionCount={0}
        />
        
        {/* Main Content */}
        <main className="flex-1 flex">
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col lg:flex-row">
              <div className="flex-1 min-h-0">
                <ModernChat
                  currentUser={currentUser}
                  selectedUserId={selectedUserId > 0 ? selectedUserId : undefined}
                  onUserSelect={setSelectedUserId}
                />
              </div>
              
              {/* Mobile-friendly right panel */}
              <div className={`
                lg:w-80 w-full lg:border-l border-[var(--cyber-cyan)]/30 
                ${selectedUserId > 0 ? 'hidden lg:block' : 'block lg:block'}
                flex flex-col
              `}>
                {/* User Profile Section */}
                <div className="p-4 border-b border-[var(--cyber-cyan)]/30">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 bg-gradient-to-br from-[var(--cyber-cyan)] to-[var(--cyber-magenta)] rounded-full flex items-center justify-center cursor-pointer"
                      onClick={() => setShowProfile(!showProfile)}
                    >
                      <span className="text-white font-bold">{currentUser.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{currentUser.username}</p>
                      <p className="text-xs text-gray-400">Connected</p>
                    </div>
                  </div>
                </div>

                {/* Profile Modal */}
                {showProfile && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <UserProfile
                      userId={currentUser.id}
                      deviceId={deviceId}
                      onClose={() => setShowProfile(false)}
                    />
                  </div>
                )}

                {/* Scanner Section */}
                <div className="flex-1 min-h-0 p-4">
                  <EnhancedScanner
                    onUserDetected={handleUserDetected}
                    onScanStateChange={setIsScanning}
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div className="flex-1 p-4">
              <NetworkAnalyticsDashboard />
            </div>
          )}
          
          {activeTab === 'transfers' && (
            <div className="flex-1 p-4">
              <FileTransferManager />
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="flex-1 p-4">
              <SecurityMonitor />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}