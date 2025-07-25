import { compress, decompress } from './lz-string';
import type { User, Story, Message, MeshNode } from '@shared/schema';

interface OfflineData {
  user: User | null;
  stories: Story[];
  messages: Message[];
  meshNodes: MeshNode[];
  connections: any[];
  settings: any;
  aiShadowProfile: any;
  lastSync: number;
  version: string;
}

class OfflineStorageManager {
  private storageKey = 'meshbook_offline_data';
  private compressionLevel = 9;

  // Compress and store data
  private compressData(data: any): string {
    const jsonString = JSON.stringify(data);
    return compress(jsonString);
  }

  // Decompress and retrieve data
  private decompressData(compressedData: string): any {
    try {
      const jsonString = decompress(compressedData);
      return jsonString ? JSON.parse(jsonString) : null;
    } catch (error) {
      console.error('Failed to decompress data:', error);
      return null;
    }
  }

  // Save complete offline data
  saveOfflineData(data: Partial<OfflineData>): void {
    try {
      const existingData = this.getOfflineData();
      const updatedData: OfflineData = {
        ...existingData,
        ...data,
        lastSync: Date.now(),
        version: '2.0'
      };

      const compressedData = this.compressData(updatedData);
      localStorage.setItem(this.storageKey, compressedData);

      // Also save to IndexedDB for larger storage
      this.saveToIndexedDB(updatedData);
      
      console.log('Offline data saved successfully');
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }

  // Get complete offline data
  getOfflineData(): OfflineData {
    try {
      const compressedData = localStorage.getItem(this.storageKey);
      if (!compressedData) {
        return this.getDefaultData();
      }

      const data = this.decompressData(compressedData);
      return data || this.getDefaultData();
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return this.getDefaultData();
    }
  }

  // Get default empty data structure
  private getDefaultData(): OfflineData {
    return {
      user: null,
      stories: [],
      messages: [],
      meshNodes: [],
      connections: [],
      settings: {
        offlineMode: false,
        autoSync: true,
        compressionEnabled: true
      },
      aiShadowProfile: null,
      lastSync: 0,
      version: '2.0'
    };
  }

  // Save user data
  saveUser(user: User): void {
    const data = this.getOfflineData();
    data.user = user;
    this.saveOfflineData(data);
  }

  // Get user data
  getUser(): User | null {
    return this.getOfflineData().user;
  }

  // Save stories
  saveStories(stories: Story[]): void {
    const data = this.getOfflineData();
    data.stories = stories;
    this.saveOfflineData(data);
  }

  // Get stories
  getStories(): Story[] {
    return this.getOfflineData().stories;
  }

  // Add single story
  addStory(story: Story): void {
    const data = this.getOfflineData();
    data.stories = [story, ...data.stories];
    this.saveOfflineData(data);
  }

  // Save messages
  saveMessages(messages: Message[]): void {
    const data = this.getOfflineData();
    data.messages = messages;
    this.saveOfflineData(data);
  }

  // Get messages
  getMessages(): Message[] {
    return this.getOfflineData().messages;
  }

  // Add single message
  addMessage(message: Message): void {
    const data = this.getOfflineData();
    data.messages = [message, ...data.messages];
    this.saveOfflineData(data);
  }

  // Save mesh nodes
  saveMeshNodes(nodes: MeshNode[]): void {
    const data = this.getOfflineData();
    data.meshNodes = nodes;
    this.saveOfflineData(data);
  }

  // Get mesh nodes
  getMeshNodes(): MeshNode[] {
    return this.getOfflineData().meshNodes;
  }

  // Save settings
  saveSettings(settings: any): void {
    const data = this.getOfflineData();
    data.settings = { ...data.settings, ...settings };
    this.saveOfflineData(data);
  }

  // Get settings
  getSettings(): any {
    return this.getOfflineData().settings;
  }

  // Save AI Shadow Profile
  saveAIShadowProfile(profile: any): void {
    const data = this.getOfflineData();
    data.aiShadowProfile = profile;
    this.saveOfflineData(data);
  }

  // Get AI Shadow Profile
  getAIShadowProfile(): any {
    return this.getOfflineData().aiShadowProfile;
  }

  // Clear all offline data
  clearOfflineData(): void {
    localStorage.removeItem(this.storageKey);
    this.clearIndexedDB();
  }

  // Get storage size info
  getStorageInfo(): { size: number; compressed: number; items: number } {
    const data = this.getOfflineData();
    const uncompressed = JSON.stringify(data).length;
    const compressed = localStorage.getItem(this.storageKey)?.length || 0;
    
    return {
      size: uncompressed,
      compressed: compressed,
      items: Object.keys(data).length
    };
  }

  // IndexedDB support for larger storage
  private async saveToIndexedDB(data: OfflineData): Promise<void> {
    try {
      if (!('indexedDB' in window)) return;

      const request = indexedDB.open('meshbook_storage', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('offline_data')) {
          db.createObjectStore('offline_data', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['offline_data'], 'readwrite');
        const store = transaction.objectStore('offline_data');
        
        store.put({ id: 'main', data: data });
      };
    } catch (error) {
      console.error('IndexedDB save failed:', error);
    }
  }

  // Clear IndexedDB
  private async clearIndexedDB(): Promise<void> {
    try {
      if (!('indexedDB' in window)) return;

      const request = indexedDB.open('meshbook_storage', 1);
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['offline_data'], 'readwrite');
        const store = transaction.objectStore('offline_data');
        store.clear();
      };
    } catch (error) {
      console.error('IndexedDB clear failed:', error);
    }
  }

  // Sync with server when online
  async syncWithServer(apiEndpoint: string): Promise<boolean> {
    try {
      const offlineData = this.getOfflineData();
      
      const response = await fetch(`${apiEndpoint}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastSync: offlineData.lastSync,
          data: offlineData
        })
      });

      if (response.ok) {
        const serverData = await response.json();
        this.saveOfflineData(serverData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    }
  }
}

// Install LZ-String compression library if not available
if (typeof compress === 'undefined') {
  // Fallback compression using basic encoding
  const fallbackCompress = (str: string): string => {
    return btoa(encodeURIComponent(str));
  };
  
  const fallbackDecompress = (str: string): string => {
    return decodeURIComponent(atob(str));
  };
  
  (window as any).compress = fallbackCompress;
  (window as any).decompress = fallbackDecompress;
}

export const offlineStorage = new OfflineStorageManager();
export default offlineStorage;