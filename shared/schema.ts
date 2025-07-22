import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  alias: text("alias").notNull().unique(), // Changed from username to alias
  profile: text("profile").notNull().default(""), // Changed from bio to profile
  avatar: text("avatar").notNull().default(""), // Changed from profileImage to avatar
  deviceId: text("device_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  privateKeyEncrypted: text("private_key_encrypted"), // Added encrypted private key storage
  meshCallsign: text("mesh_callsign").notNull().unique(), // Added unique mesh identifier
  securityLevel: integer("security_level").notNull().default(1), // 1-5 security clearance
  nodeCapabilities: text("node_capabilities").array().notNull().default([]), // Array of capabilities
  isOnline: boolean("is_online").notNull().default(false),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id),
  toUserId: integer("to_user_id").references(() => users.id),
  content: text("content").notNull(),
  encryptedContent: text("encrypted_content").notNull(),
  messageType: text("message_type").notNull().default("text"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isEphemeral: boolean("is_ephemeral").notNull().default(true),
  meshHops: integer("mesh_hops").notNull().default(0),
});

export const meshNodes = pgTable("mesh_nodes", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull().unique(),
  userId: integer("user_id").references(() => users.id),
  signalStrength: integer("signal_strength").notNull().default(0),
  distance: integer("distance").notNull().default(0),
  connectionType: text("connection_type").notNull(), // 'bluetooth', 'webrtc', 'wifi'
  isActive: boolean("is_active").notNull().default(true),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
});

export const stories = pgTable("stories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  alias: true,
  profile: true,
  avatar: true,
  deviceId: true,
  publicKey: true,
  privateKeyEncrypted: true,
  meshCallsign: true,
  securityLevel: true,
  nodeCapabilities: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  alias: true,
  profile: true,
  avatar: true,
  securityLevel: true,
  nodeCapabilities: true,
}).partial();

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

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Story = typeof stories.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type MeshNode = typeof meshNodes.$inferSelect;
export type InsertMeshNode = z.infer<typeof insertMeshNodeSchema>;
