export interface MeshNode {
  id: string;
  name: string;
  walletAddress: string;
  signalStrength: number;
  distance: number;
  connectionType: 'bluetooth' | 'webrtc' | 'wifi';
  isOnline: boolean;
  position: { x: number; y: number };
}

export interface ChatMessage {
  id: string;
  fromUserId: string;
  fromUsername: string;
  content: string;
  timestamp: Date;
  messageType: 'text' | 'image' | 'system';
  isEncrypted: boolean;
  meshHops: number;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  title: string;
  content: string;
  mediaUrl?: string;
  timestamp: Date;
  expiresAt: Date;
  isNew: boolean;
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'user-joined' | 'user-left' | 'bluetooth-discovery';
  targetUserId?: string;
  fromUserId?: string;
  data?: any;
  userId?: string;
  nodeId?: string;
  signalStrength?: number;
}

export interface BluetoothDevice {
  id: string;
  name: string;
  rssi: number;
  isConnected: boolean;
}
