import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  walletAddress: text("wallet_address").notNull().unique(),
  publicKey: text("public_key").notNull(),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
  content: text("content").notNull(),
  encryptedContent: text("encrypted_content").notNull(),
  messageType: text("message_type").notNull().default("text"),
  timestamp: timestamp("timestamp").defaultNow(),
  isEphemeral: boolean("is_ephemeral").default(true),
  meshHops: integer("mesh_hops").default(0),
});

export const meshNodes = pgTable("mesh_nodes", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  signalStrength: integer("signal_strength").default(0),
  distance: integer("distance").default(0),
  connectionType: text("connection_type").notNull(), // 'bluetooth', 'webrtc', 'wifi'
  isActive: boolean("is_active").default(true),
  lastSeen: timestamp("last_seen").defaultNow(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  walletAddress: true,
  publicKey: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  fromUserId: true,
  toUserId: true,
  content: true,
  encryptedContent: true,
  messageType: true,
  isEphemeral: true,
  meshHops: true,
});

export const insertMeshNodeSchema = createInsertSchema(meshNodes).pick({
  nodeId: true,
  userId: true,
  signalStrength: true,
  distance: true,
  connectionType: true,
  isActive: true,
});

export const insertStorySchema = createInsertSchema(stories).pick({
  userId: true,
  title: true,
  content: true,
  mediaUrl: true,
  expiresAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMeshNode = z.infer<typeof insertMeshNodeSchema>;
export type MeshNode = typeof meshNodes.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
