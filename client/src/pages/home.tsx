import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { NetworkExplorer } from '@/components/network-explorer';
import { ChatInterface } from '@/components/chat-interface';
import { RightPanel } from '@/components/right-panel';
import { NetworkAnalyticsDashboard } from '@/components/network-analytics-dashboard';
import { FileTransferManager } from '@/components/file-transfer-manager';
import { SecurityMonitor } from '@/components/security-monitor';
import { useSimpleWebRTC } from '@/hooks/use-simple-webrtc';
import { useEncryption } from '@/hooks/use-encryption';
import { useAdvancedMesh } from '@/hooks/use-advanced-mesh';
import { ChatMessage } from '@/types/mesh';

export default function Home() {
  const [currentUserId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const { sendP2PMessage, connectedPeers, isConnected: isWebRTCConnected } = useSimpleWebRTC(currentUserId);
  const { encryptMessage, decryptMessage, isReady } = useEncryption();
  const { 
    isConnected: isMeshConnected,
    connectionQuality,
    networkMetrics,
    sendMeshMessage,
    messages: meshMessages
  } = useAdvancedMesh(currentUserId);

  useEffect(() => {
    if (isReady && (isWebRTCConnected || isMeshConnected)) {
      setIsConnected(true);
    }
  }, [isReady, isWebRTCConnected, isMeshConnected]);

  // Merge WebRTC and mesh messages
  useEffect(() => {
    if (meshMessages.length > 0) {
      const formattedMessages = meshMessages.map(msg => ({
        id: msg.id,
        fromUserId: msg.source || msg.type === 'system' ? 'system' : currentUserId,
        fromUsername: msg.source || (msg.type === 'system' ? 'System' : 'You'),
        content: msg.content,
        timestamp: msg.timestamp || new Date(),
        messageType: 'text' as const,
        isEncrypted: msg.type === 'mesh',
        meshHops: msg.hopCount || 0
      }));
      setMessages(prev => [...prev, ...formattedMessages]);
    }
  }, [meshMessages, currentUserId]);

  const handleSendMessage = async (content: string) => {
    try {
      const encryptedContent = await encryptMessage(content);
      
      const message: ChatMessage = {
        id: Date.now().toString(),
        fromUserId: currentUserId,
        fromUsername: 'You',
        content,
        timestamp: new Date(),
        messageType: 'text',
        isEncrypted: true,
        meshHops: 0
      };

      setMessages(prev => [...prev, message]);
      
      // Send via WebRTC
      sendP2PMessage({
        type: 'message',
        message: {
          ...message,
          content: encryptedContent
        }
      });

      // Send via mesh network if available
      if (isMeshConnected && connectedPeers.length > 0) {
        sendMeshMessage(connectedPeers[0], encryptedContent);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Initialize with some demo messages
  useEffect(() => {
    const demoMessages: ChatMessage[] = [
      {
        id: '1',
        fromUserId: 'demo1',
        fromUsername: 'CyberNode_A1',
        content: 'Mesh network is stable. Signal strength optimal for relay operations.',
        timestamp: new Date(Date.now() - 120000),
        messageType: 'text',
        isEncrypted: true,
        meshHops: 1
      },
      {
        id: '2',
        fromUserId: currentUserId,
        fromUsername: 'You',
        content: 'Copy that. Initiating new relay connection to extend mesh coverage.',
        timestamp: new Date(Date.now() - 60000),
        messageType: 'text',
        isEncrypted: true,
        meshHops: 0
      },
      {
        id: '3',
        fromUserId: 'demo3',
        fromUsername: 'NetRunner_X9',
        content: 'New mesh deployment in sector 7. Network topology expanding rapidly.',
        timestamp: new Date(Date.now() - 30000),
        messageType: 'text',
        isEncrypted: true,
        meshHops: 3
      }
    ];
    
    setMessages(demoMessages);
  }, [currentUserId]);

  const renderMainContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="flex-1 flex">
            <NetworkExplorer connectedPeers={connectedPeers} />
            <ChatInterface 
              messages={messages}
              onSendMessage={handleSendMessage}
              isConnected={isConnected}
              currentUserId={currentUserId}
            />
            <RightPanel />
          </div>
        );
      case 'analytics':
        return (
          <div className="flex-1 overflow-auto">
            <NetworkAnalyticsDashboard nodeId={currentUserId} />
          </div>
        );
      case 'transfers':
        return (
          <div className="flex-1 overflow-auto">
            <FileTransferManager 
              nodeId={currentUserId} 
              availableNodes={connectedPeers}
            />
          </div>
        );
      case 'security':
        return (
          <div className="flex-1 overflow-auto">
            <SecurityMonitor nodeId={currentUserId} />
          </div>
        );
      case 'network':
        return (
          <div className="flex-1 p-4">
            <NetworkExplorer connectedPeers={connectedPeers} />
          </div>
        );
      case 'stories':
        return (
          <div className="flex-1 flex">
            <div className="flex-1 p-4">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-[var(--cyber-cyan)] mb-4">Stories</h2>
                <p className="text-gray-400">Coming soon...</p>
              </div>
            </div>
          </div>
        );
      case 'bluetooth':
        return (
          <div className="flex-1 p-4">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-[var(--cyber-cyan)] mb-4">Bluetooth Mesh</h2>
              <p className="text-gray-400">Advanced Bluetooth mesh networking interface coming soon...</p>
            </div>
          </div>
        );
      default:
        return renderMainContent();
    }
  };

  return (
    <div className="h-screen flex bg-[var(--cyber-dark)] text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-[var(--cyber-cyan)]/5 via-transparent to-transparent animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-[var(--cyber-magenta)]/5 via-transparent to-transparent animate-pulse"></div>
      </div>
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderMainContent()}
    </div>
  );
}
