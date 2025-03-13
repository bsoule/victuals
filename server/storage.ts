import { users, photos, comments, type User, type InsertUser, type Photo, type InsertPhoto, type Comment, type InsertComment } from "@shared/schema";
import { format, startOfDay } from "date-fns";
import { toZonedTime } from 'date-fns-tz';

// Helper function to normalize dates to user's timezone
function normalizeToLocalDate(date: Date): Date {
  return startOfDay(toZonedTime(date, Intl.DateTimeFormat().resolvedOptions().timeZone));
}

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
    // Store in UTC time
    const photo: Photo = { 
      id,
      userId: Number(insertPhoto.userId),
      imageUrl: insertPhoto.imageUrl,
      takenAt: new Date(), // Store in UTC
      description: insertPhoto.description || null
    };
    console.log('Creating photo:', { 
      ...photo, 
      imageUrl: '[truncated]',
      takenAt: format(photo.takenAt, 'yyyy-MM-dd HH:mm:ss xxx')
    }); 
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
    console.log('Fetching photos for user:', userId, 'date:', date);

    // Convert input date to UTC midnight of that day
    const localMidnight = startOfDay(toZonedTime(date, Intl.DateTimeFormat().resolvedOptions().timeZone));
    const targetDate = format(localMidnight, 'yyyy-MM-dd');

    const allPhotos = Array.from(this.photos.values());
    console.log('All photos before filtering:', allPhotos.map(p => ({ 
      id: p.id, 
      userId: p.userId,
      takenAt: p.takenAt,
      localDate: format(toZonedTime(p.takenAt, Intl.DateTimeFormat().resolvedOptions().timeZone), 'yyyy-MM-dd')
    })));

    const photos = allPhotos.filter(photo => {
      // Convert photo's UTC timestamp to local date for comparison
      const photoLocalDate = format(
        toZonedTime(photo.takenAt, Intl.DateTimeFormat().resolvedOptions().timeZone),
        'yyyy-MM-dd'
      );
      const matches = photo.userId === userId && photoLocalDate === targetDate;
      console.log('Photo', photo.id, {
        photoUserId: photo.userId,
        requestedUserId: userId,
        photoLocalDate,
        targetDate,
        matches
      });
      return matches;
    });

    console.log('Filtered photos:', photos.length, 'for date:', targetDate);
    return photos;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const newComment: Comment = {
      id,
      userId: Number(insertComment.userId),
      username: insertComment.username,
      content: insertComment.content,
      createdAt: new Date(),
      date: normalizeToLocalDate(new Date(insertComment.date))
    };
    console.log('Creating new comment:', newComment); 
    this.comments.set(id, newComment);
    return newComment;
  }

  async getCommentsByUserAndDate(userId: number, date: Date): Promise<Comment[]> {
    console.log('Fetching comments for user:', userId, 'date:', date); 
    const targetDate = format(normalizeToLocalDate(date), 'yyyy-MM-dd');
    const comments = Array.from(this.comments.values()).filter(comment => {
      const commentDate = format(normalizeToLocalDate(comment.date), 'yyyy-MM-dd');
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