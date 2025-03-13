import { pgTable, text, serial, timestamp, varchar, integer } from "drizzle-orm/pg-core";
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
  timeSlot: integer("time_slot").notNull(), // 0-5 representing the square position
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  username: varchar("username", { length: 50 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  date: timestamp("date").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  userId: true,
  imageUrl: true,
  description: true,
  timeSlot: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  userId: true,
  username: true,
  content: true,
  date: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;