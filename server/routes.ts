import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPhotoSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

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

  const httpServer = createServer(app);
  return httpServer;
}
