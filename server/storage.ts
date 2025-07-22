import { users, messages, meshNodes, stories, type User, type InsertUser, type UpdateUser, type Message, type InsertMessage, type MeshNode, type InsertMeshNode, type Story, type InsertStory } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByDeviceId(deviceId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
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

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByDeviceId(deviceId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.deviceId, deviceId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, lastSeen: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isOnline, lastSeen: new Date() })
      .where(eq(users.id, id));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.fromUserId, userId),
          eq(messages.toUserId, userId)
        )
      );
  }

  async getRecentMessages(limit: number = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .orderBy(messages.timestamp)
      .limit(limit);
  }

  async createMeshNode(insertNode: InsertMeshNode): Promise<MeshNode> {
    const [node] = await db
      .insert(meshNodes)
      .values(insertNode)
      .returning();
    return node;
  }

  async getMeshNodes(): Promise<MeshNode[]> {
    return await db.select().from(meshNodes);
  }

  async getActiveMeshNodes(): Promise<MeshNode[]> {
    return await db
      .select()
      .from(meshNodes)
      .where(eq(meshNodes.isActive, true));
  }

  async updateMeshNodeStatus(nodeId: string, isOnline: boolean): Promise<void> {
    await db
      .update(meshNodes)
      .set({ isActive: isOnline, lastSeen: new Date() })
      .where(eq(meshNodes.nodeId, nodeId));
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const [story] = await db
      .insert(stories)
      .values(insertStory)
      .returning();
    return story;
  }

  async getActiveStories(): Promise<Story[]> {
    return await db
      .select()
      .from(stories)
      .where(gt(stories.expiresAt, new Date()));
  }

  async getStoriesByUser(userId: number): Promise<Story[]> {
    return await db
      .select()
      .from(stories)
      .where(eq(stories.userId, userId));
  }
}

export const storage = new DatabaseStorage();
