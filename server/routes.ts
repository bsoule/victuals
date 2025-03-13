import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPhotoSchema, insertCommentSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Only .jpeg, .png and .gif format allowed!'));
      return;
    }
    cb(null, true);
  }
});

// Schema for photo description updates
const updatePhotoSchema = z.object({
  description: z.string().nullable(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post('/api/users', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);

      if (existingUser) {
        return res.json(existingUser);
      }

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: 'Invalid user data' });
    }
  });

  app.post('/api/photos', upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        throw new Error('No file uploaded');
      }

      // In a real app, we'd upload to cloud storage
      // For demo, we'll create a data URL
      const base64Image = req.file.buffer.toString('base64');
      const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      const photoData = insertPhotoSchema.parse({
        ...req.body,
        imageUrl,
        userId: parseInt(req.body.userId)
      });

      const photo = await storage.createPhoto(photoData);
      res.json(photo);
    } catch (error) {
      res.status(400).json({ error: 'Invalid photo data' });
    }
  });

  app.patch('/api/photos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = updatePhotoSchema.parse(req.body);
      const photo = await storage.updatePhoto(parseInt(id), updateData);
      res.json(photo);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update photo' });
    }
  });

  app.delete('/api/photos/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePhoto(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete photo' });
    }
  });

  app.get('/api/users/:username/photos', async (req, res) => {
    try {
      const { username } = req.params;
      const { date } = req.query;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const targetDate = date ? new Date(date as string) : new Date();
      const photos = await storage.getPhotosByUserAndDate(user.id, targetDate);

      res.json(photos);
    } catch (error) {
      res.status(400).json({ error: 'Invalid request' });
    }
  });

  // New comment routes
  app.post('/api/comments', async (req, res) => {
    try {
      console.log('Received comment data:', req.body); // Debug log
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId: Number(req.body.userId),
        date: new Date(req.body.date)
      });
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error('Comment validation error:', error); // Debug log
      res.status(400).json({ error: 'Invalid comment data', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/api/comments', async (req, res) => {
    try {
      const { date, userId } = req.query;
      if (!date || !userId) {
        return res.status(400).json({ error: 'Date and userId parameters are required' });
      }

      const targetDate = new Date(date as string);
      const comments = await storage.getCommentsByUserAndDate(Number(userId), targetDate);
      res.json(comments);
    } catch (error) {
      res.status(400).json({ error: 'Invalid request' });
    }
  });

  app.patch('/api/comments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { content, username } = req.body;

      // Get the existing comment
      const existingComment = await storage.getComment(parseInt(id));
      if (!existingComment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Check if the user is the author of the comment
      if (existingComment.username !== username) {
        return res.status(403).json({ error: 'Not authorized to edit this comment' });
      }

      const comment = await storage.updateComment(parseInt(id), { content });
      res.json(comment);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update comment' });
    }
  });

  app.delete('/api/comments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { username, diaryOwnerId } = req.body;

      // Get the existing comment
      const existingComment = await storage.getComment(parseInt(id));
      if (!existingComment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Check if the user is either:
      // 1. The author of the comment, OR
      // 2. The owner of the diary where the comment was posted
      const isCommentAuthor = existingComment.username.toLowerCase() === username.toLowerCase();
      const isDiaryOwner = existingComment.userId === diaryOwnerId;

      if (!isCommentAuthor && !isDiaryOwner) {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }

      await storage.deleteComment(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete comment' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}