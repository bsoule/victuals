import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  imageUrl: text("image_url").notNull(),
  takenAt: timestamp("taken_at").notNull().defaultNow(),
  description: text("description"),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  date: timestamp("date").notNull(), // The day this comment belongs to
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  userId: true,
  imageUrl: true,
  description: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  content: true,
  date: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;