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
  comment: text("comment"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  userId: true,
  imageUrl: true,
  comment: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;