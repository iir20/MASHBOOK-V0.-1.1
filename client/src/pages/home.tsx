import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { NetworkExplorer } from '@/components/network-explorer';
import { ChatInterface } from '@/components/chat-interface';
import { RightPanel } from '@/components/right-panel';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useEncryption } from '@/hooks/use-encryption';
import { useBluetoothMesh } from '@/hooks/use-bluetooth-mesh';
import { ChatMessage } from '@/types/mesh';

export default function Home() {
  const [currentUserId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const { joinRoom, sendP2PMessage, connectedPeers } = useWebRTC(currentUserId);
  const { encryptMessage, decryptMessage, isReady } = useEncryption();
  const { 
    sendMessage: sendBluetoothMessage, 
    broadcastMessage: broadcastBluetoothMessage,
    isInitialized: isBluetoothInitialized 
  } = useBluetoothMesh(currentUserId);

  useEffect(() => {
    if (isReady) {
      joinRoom();
      setIsConnected(true);
    }
  }, [isReady, joinRoom]);

  useEffect(() => {
    if (isBluetoothInitialized) {
      console.log('Bluetooth mesh initialized');
    }
  }, [isBluetoothInitialized]);

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

      // Also broadcast via Bluetooth mesh if available
      if (isBluetoothInitialized) {
        try {
          await broadcastBluetoothMessage(content);
        } catch (error) {
          console.error('Failed to send Bluetooth message:', error);
        }
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

  return (
    <div className="h-screen flex bg-[var(--cyber-dark)] text-white overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-[var(--cyber-cyan)]/5 via-transparent to-transparent animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-[var(--cyber-magenta)]/5 via-transparent to-transparent animate-pulse"></div>
      </div>
      
      <Sidebar />
      <NetworkExplorer connectedPeers={connectedPeers} />
      <ChatInterface 
        messages={messages}
        onSendMessage={handleSendMessage}
        isConnected={isConnected || isBluetoothInitialized}
      />
      <RightPanel />
    </div>
  );
}
