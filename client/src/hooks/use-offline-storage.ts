import { useState, useEffect, useCallback } from 'react';
import type { User, Message, Story } from '@shared/schema';

interface OfflineData {
  users: User[];
  messages: Message[];
  stories: Story[];
  lastSync: number;
}

const STORAGE_KEYS = {
  USERS: 'meshbook_offline_users',
  MESSAGES: 'meshbook_offline_messages', 
  STORIES: 'meshbook_offline_stories',
  LAST_SYNC: 'meshbook_last_sync'
};

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    users: [],
    messages: [],
    stories: [],
    lastSync: 0
  });

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load offline data on mount
  useEffect(() => {
    loadOfflineData();
  }, []);

  const loadOfflineData = useCallback(() => {
    try {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
      const stories = JSON.parse(localStorage.getItem(STORAGE_KEYS.STORIES) || '[]');
      const lastSync = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || '0');

      setOfflineData({ users, messages, stories, lastSync });
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, []);

  const saveToOffline = useCallback((type: keyof OfflineData, data: any[]) => {
    try {
      const storageKey = type === 'users' ? STORAGE_KEYS.USERS :
                        type === 'messages' ? STORAGE_KEYS.MESSAGES :
                        STORAGE_KEYS.STORIES;
      
      localStorage.setItem(storageKey, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      
      setOfflineData(prev => ({
        ...prev,
        [type]: data,
        lastSync: Date.now()
      }));
    } catch (error) {
      console.error('Error saving to offline storage:', error);
    }
  }, []);

  const addOfflineMessage = useCallback((message: Message) => {
    const messages = [...offlineData.messages, message];
    saveToOffline('messages', messages);
  }, [offlineData.messages, saveToOffline]);

  const addOfflineStory = useCallback((story: Story) => {
    const stories = [...offlineData.stories, story];
    saveToOffline('stories', stories);
  }, [offlineData.stories, saveToOffline]);

  const updateOfflineUser = useCallback((updatedUser: User) => {
    const users = offlineData.users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    );
    if (!users.find(u => u.id === updatedUser.id)) {
      users.push(updatedUser);
    }
    saveToOffline('users', users);
  }, [offlineData.users, saveToOffline]);

  const syncWithServer = useCallback(async () => {
    if (!isOnline) return false;

    try {
      // Sync users
      const usersResponse = await fetch('/api/users');
      if (usersResponse.ok) {
        const serverUsers = await usersResponse.json();
        saveToOffline('users', serverUsers);
      }

      // Sync stories
      const storiesResponse = await fetch('/api/stories');
      if (storiesResponse.ok) {
        const serverStories = await storiesResponse.json();
        saveToOffline('stories', serverStories);
      }

      // Sync messages
      const messagesResponse = await fetch('/api/messages');
      if (messagesResponse.ok) {
        const serverMessages = await messagesResponse.json();
        saveToOffline('messages', serverMessages);
      }

      return true;
    } catch (error) {
      console.error('Sync error:', error);
      return false;
    }
  }, [isOnline, saveToOffline]);

  const getPendingSyncItems = useCallback(() => {
    const now = Date.now();
    const pendingMessages = offlineData.messages.filter(m => 
      (m.timestamp as any) > offlineData.lastSync
    );
    const pendingStories = offlineData.stories.filter(s => 
      (s.createdAt as any) > offlineData.lastSync
    );

    return {
      messages: pendingMessages,
      stories: pendingStories,
      count: pendingMessages.length + pendingStories.length
    };
  }, [offlineData]);

  return {
    isOnline,
    offlineData,
    loadOfflineData,
    saveToOffline,
    addOfflineMessage,
    addOfflineStory,
    updateOfflineUser,
    syncWithServer,
    getPendingSyncItems
  };
}