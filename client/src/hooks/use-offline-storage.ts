import { useState, useEffect, useCallback } from 'react';

export interface OfflineMessage {
  id: string;
  content: string;
  timestamp: number;
  fromUserId: string;
  toUserId?: string;
  isEncrypted: boolean;
  status: 'pending' | 'sent' | 'failed';
}

export interface OfflineUser {
  id: string;
  username: string;
  lastSeen: number;
  publicKey?: string;
  walletAddress?: string;
  isOnline: boolean;
}

export interface OfflineFileTransfer {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  fromUserId: string;
  toUserId: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  MESSAGES: 'mesh_offline_messages',
  USERS: 'mesh_offline_users',
  FILES: 'mesh_offline_files',
  KEYS: 'mesh_crypto_keys',
  SETTINGS: 'mesh_settings'
};

export function useOfflineStorage() {
  const [messages, setMessages] = useState<OfflineMessage[]>([]);
  const [users, setUsers] = useState<OfflineUser[]>([]);
  const [fileTransfers, setFileTransfers] = useState<OfflineFileTransfer[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const storedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
        const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        const storedFiles = localStorage.getItem(STORAGE_KEYS.FILES);

        if (storedMessages) {
          setMessages(JSON.parse(storedMessages));
        }
        if (storedUsers) {
          setUsers(JSON.parse(storedUsers));
        }
        if (storedFiles) {
          setFileTransfers(JSON.parse(storedFiles));
        }
      } catch (error) {
        console.error('Error loading offline data:', error);
      }
    };

    loadFromStorage();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setIsOfflineMode(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save messages to localStorage
  const saveMessages = useCallback((newMessages: OfflineMessage[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(newMessages));
      setMessages(newMessages);
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, []);

  // Save users to localStorage
  const saveUsers = useCallback((newUsers: OfflineUser[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
      setUsers(newUsers);
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }, []);

  // Save file transfers to localStorage
  const saveFileTransfers = useCallback((newFiles: OfflineFileTransfer[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(newFiles));
      setFileTransfers(newFiles);
    } catch (error) {
      console.error('Error saving files:', error);
    }
  }, []);

  // Add a new message (offline-first)
  const addMessage = useCallback((message: Omit<OfflineMessage, 'id' | 'timestamp' | 'status'>) => {
    const newMessage: OfflineMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: isOfflineMode ? 'pending' : 'sent'
    };

    const updatedMessages = [...messages, newMessage];
    saveMessages(updatedMessages);
    return newMessage;
  }, [messages, isOfflineMode, saveMessages]);

  // Add or update a user
  const addOrUpdateUser = useCallback((user: Omit<OfflineUser, 'lastSeen'>) => {
    const updatedUser: OfflineUser = {
      ...user,
      lastSeen: Date.now()
    };

    const existingIndex = users.findIndex(u => u.id === user.id);
    let updatedUsers;

    if (existingIndex >= 0) {
      updatedUsers = [...users];
      updatedUsers[existingIndex] = updatedUser;
    } else {
      updatedUsers = [...users, updatedUser];
    }

    saveUsers(updatedUsers);
    return updatedUser;
  }, [users, saveUsers]);

  // Add a file transfer
  const addFileTransfer = useCallback((transfer: Omit<OfflineFileTransfer, 'id' | 'timestamp'>) => {
    const newTransfer: OfflineFileTransfer = {
      ...transfer,
      id: Date.now().toString(),
      timestamp: Date.now()
    };

    const updatedTransfers = [...fileTransfers, newTransfer];
    saveFileTransfers(updatedTransfers);
    return newTransfer;
  }, [fileTransfers, saveFileTransfers]);

  // Update message status
  const updateMessageStatus = useCallback((messageId: string, status: OfflineMessage['status']) => {
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    );
    saveMessages(updatedMessages);
  }, [messages, saveMessages]);

  // Update file transfer progress
  const updateFileTransferProgress = useCallback((transferId: string, progress: number, status?: OfflineFileTransfer['status']) => {
    const updatedTransfers = fileTransfers.map(transfer => 
      transfer.id === transferId 
        ? { ...transfer, progress, ...(status && { status }) }
        : transfer
    );
    saveFileTransfers(updatedTransfers);
  }, [fileTransfers, saveFileTransfers]);

  // Get pending messages (for sync when back online)
  const getPendingMessages = useCallback(() => {
    return messages.filter(msg => msg.status === 'pending');
  }, [messages]);

  // Get recent users (active in last 24 hours)
  const getRecentUsers = useCallback(() => {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    return users.filter(user => user.lastSeen > twentyFourHoursAgo);
  }, [users]);

  // Sync pending data when back online
  const syncPendingData = useCallback(async () => {
    const pendingMessages = getPendingMessages();
    
    // Try to send pending messages
    for (const message of pendingMessages) {
      try {
        // Simulate sending message - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 100));
        updateMessageStatus(message.id, 'sent');
      } catch (error) {
        console.error('Failed to sync message:', error);
        updateMessageStatus(message.id, 'failed');
      }
    }
  }, [getPendingMessages, updateMessageStatus]);

  // Store encryption keys
  const storeKeys = useCallback((keys: { publicKey: string; privateKey: string; walletAddress: string }) => {
    try {
      localStorage.setItem(STORAGE_KEYS.KEYS, JSON.stringify(keys));
    } catch (error) {
      console.error('Error storing keys:', error);
    }
  }, []);

  // Load encryption keys
  const loadKeys = useCallback(() => {
    try {
      const storedKeys = localStorage.getItem(STORAGE_KEYS.KEYS);
      return storedKeys ? JSON.parse(storedKeys) : null;
    } catch (error) {
      console.error('Error loading keys:', error);
      return null;
    }
  }, []);

  // Store app settings
  const storeSettings = useCallback((settings: any) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error storing settings:', error);
    }
  }, []);

  // Load app settings
  const loadSettings = useCallback(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return storedSettings ? JSON.parse(storedSettings) : {};
    } catch (error) {
      console.error('Error loading settings:', error);
      return {};
    }
  }, []);

  // Clear all offline data
  const clearOfflineData = useCallback(() => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      setMessages([]);
      setUsers([]);
      setFileTransfers([]);
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  }, []);

  // Calculate storage usage
  const getStorageUsage = useCallback(() => {
    try {
      let totalSize = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += new Blob([item]).size;
        }
      });
      return totalSize;
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return 0;
    }
  }, []);

  return {
    // State
    messages,
    users,
    fileTransfers,
    isOfflineMode,
    
    // Actions
    addMessage,
    addOrUpdateUser,
    addFileTransfer,
    updateMessageStatus,
    updateFileTransferProgress,
    
    // Getters
    getPendingMessages,
    getRecentUsers,
    
    // Sync
    syncPendingData,
    
    // Storage
    storeKeys,
    loadKeys,
    storeSettings,
    loadSettings,
    clearOfflineData,
    getStorageUsage
  };
}