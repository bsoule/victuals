import { users, photos, type User, type InsertUser, type Photo, type InsertPhoto } from "@shared/schema";
import { format } from "date-fns";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, updates: { description: string | null }): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;
  getPhotosByUserAndDate(userId: number, date: Date): Promise<Photo[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private photos: Map<number, Photo>;
  private currentUserId: number;
  private currentPhotoId: number;

  constructor() {
    this.users = new Map();
    this.photos = new Map();
    this.currentUserId = 1;
    this.currentPhotoId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.currentPhotoId++;
    const photo: Photo = { 
      ...insertPhoto, 
      id,
      takenAt: new Date()
    };
    this.photos.set(id, photo);
    return photo;
  }

  async updatePhoto(id: number, updates: { description: string | null }): Promise<Photo> {
    const photo = this.photos.get(id);
    if (!photo) {
      throw new Error('Photo not found');
    }

    const updatedPhoto = { ...photo, ...updates };
    this.photos.set(id, updatedPhoto);
    return updatedPhoto;
  }

  async deletePhoto(id: number): Promise<void> {
    this.photos.delete(id);
  }

  async getPhotosByUserAndDate(userId: number, date: Date): Promise<Photo[]> {
    const targetDate = format(date, 'yyyy-MM-dd');
    return Array.from(this.photos.values()).filter(photo => {
      const photoDate = format(photo.takenAt, 'yyyy-MM-dd');
      return photo.userId === userId && photoDate === targetDate;
    });
  }
}

export const storage = new MemStorage();