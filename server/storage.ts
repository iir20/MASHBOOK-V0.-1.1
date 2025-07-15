import { users, messages, meshNodes, stories, type User, type InsertUser, type Message, type InsertMessage, type MeshNode, type InsertMeshNode, type Story, type InsertStory } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByDeviceId(deviceId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getRecentMessages(limit?: number): Promise<Message[]>;
  
  // Mesh node methods
  createMeshNode(node: InsertMeshNode): Promise<MeshNode>;
  getMeshNodes(): Promise<MeshNode[]>;
  getActiveMeshNodes(): Promise<MeshNode[]>;
  updateMeshNodeStatus(nodeId: string, isActive: boolean): Promise<void>;
  
  // Story methods
  createStory(story: InsertStory): Promise<Story>;
  getActiveStories(): Promise<Story[]>;
  getStoriesByUser(userId: number): Promise<Story[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private meshNodes: Map<number, MeshNode>;
  private stories: Map<number, Story>;
  private currentUserId: number;
  private currentMessageId: number;
  private currentNodeId: number;
  private currentStoryId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.meshNodes = new Map();
    this.stories = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.currentNodeId = 1;
    this.currentStoryId = 1;
  }



  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByDeviceId(deviceId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.deviceId === deviceId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      isOnline: true,
      lastSeen: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates, lastSeen: new Date() };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      this.users.set(id, user);
    }
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.fromUserId === userId || message.toUserId === userId
    );
  }

  async getRecentMessages(limit: number = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createMeshNode(insertNode: InsertMeshNode): Promise<MeshNode> {
    const id = this.currentNodeId++;
    const node: MeshNode = {
      ...insertNode,
      id,
      lastSeen: new Date(),
    };
    this.meshNodes.set(id, node);
    return node;
  }

  async getMeshNodes(): Promise<MeshNode[]> {
    return Array.from(this.meshNodes.values());
  }

  async getActiveMeshNodes(): Promise<MeshNode[]> {
    return Array.from(this.meshNodes.values()).filter(node => node.isActive);
  }

  async updateMeshNodeStatus(nodeId: string, isActive: boolean): Promise<void> {
    const node = Array.from(this.meshNodes.values()).find(n => n.nodeId === nodeId);
    if (node) {
      node.isActive = isActive;
      node.lastSeen = new Date();
      this.meshNodes.set(node.id, node);
    }
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = this.currentStoryId++;
    const story: Story = {
      ...insertStory,
      id,
      createdAt: new Date(),
    };
    this.stories.set(id, story);
    return story;
  }

  async getActiveStories(): Promise<Story[]> {
    const now = new Date();
    return Array.from(this.stories.values()).filter(
      (story) => story.expiresAt > now
    );
  }

  async getStoriesByUser(userId: number): Promise<Story[]> {
    return Array.from(this.stories.values()).filter(
      (story) => story.userId === userId
    );
  }
}

export const storage = new MemStorage();
