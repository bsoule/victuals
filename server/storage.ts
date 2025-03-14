import { users, photos, comments, type User, type InsertUser, type Photo, type InsertPhoto, type Comment, type InsertComment } from "@shared/schema";
import { format, startOfDay } from "date-fns";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, updates: { description: string | null }): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;
  getPhotosByUserAndDate(userId: number, date: Date): Promise<Photo[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByUserAndDate(userId: number, date: Date): Promise<Comment[]>;
  getComment(id: number): Promise<Comment | undefined>;
  updateComment(id: number, updates: { content: string }): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private photos: Map<number, Photo>;
  private comments: Map<number, Comment>;
  private currentUserId: number;
  private currentPhotoId: number;
  private currentCommentId: number;

  constructor() {
    this.users = new Map();
    this.photos = new Map();
    this.comments = new Map();
    this.currentUserId = 1;
    this.currentPhotoId = 1;
    this.currentCommentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser,
      username: insertUser.username.toLowerCase(), 
      id 
    };
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
    const targetDate = format(startOfDay(date), 'yyyy-MM-dd');
    return Array.from(this.photos.values()).filter(photo => {
      const photoDate = format(startOfDay(photo.takenAt), 'yyyy-MM-dd');
      return photo.userId === userId && photoDate === targetDate;
    });
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const newComment: Comment = {
      id,
      userId: Number(insertComment.userId),
      username: insertComment.username,
      content: insertComment.content,
      createdAt: new Date(),
      date: startOfDay(new Date(insertComment.date))
    };
    console.log('Creating new comment:', newComment); 
    this.comments.set(id, newComment);
    return newComment;
  }

  async getCommentsByUserAndDate(userId: number, date: Date): Promise<Comment[]> {
    console.log('Fetching comments for user:', userId, 'date:', date); 
    const targetDate = format(startOfDay(date), 'yyyy-MM-dd');
    const comments = Array.from(this.comments.values()).filter(comment => {
      const commentDate = format(startOfDay(comment.date), 'yyyy-MM-dd');
      const match = comment.userId === userId && commentDate === targetDate;
      console.log('Comment:', comment, 'matches:', match); 
      return match;
    });
    console.log('Found comments:', comments); 
    return comments;
  }

  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }

  async updateComment(id: number, updates: { content: string }): Promise<Comment> {
    const comment = this.comments.get(id);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const updatedComment = { ...comment, ...updates };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }

  async deleteComment(id: number): Promise<void> {
    this.comments.delete(id);
  }
}

export const storage = new MemStorage();