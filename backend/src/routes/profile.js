import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${ext}`);
  },
});

// File filter (accept images only)
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed!'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/**
 * GET /api/profile
 * Retrieve profile information for the authenticated user.
 */
router.get('/', requireAuth, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

/**
 * PUT /api/profile
 * Update profile details: name, username, and notification preferences.
 */
router.put('/', requireAuth, async (req, res, next) => {
  try {
    const {
      name,
      username,
      notifyNewTask,
      notifyDueDate,
      notifyOverdue,
      notifyDailyReminder,
    } = req.body;
    const userId = req.user.id;

    const updateData = {};

    // Validate and update Name if provided
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return res.status(400).json({ success: false, error: 'Name must be a string' });
      }
      updateData.name = name.trim() || null;
    }

    // Validate and update Username if provided
    if (username !== undefined) {
      if (typeof username !== 'string') {
        return res.status(400).json({ success: false, error: 'Username must be a string' });
      }
      
      const cleanUsername = username.trim();
      
      if (cleanUsername !== '') {
        // Alphanumeric + Underscores, 3 to 20 chars
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(cleanUsername)) {
          return res.status(400).json({
            success: false,
            error: 'Username must be between 3 and 20 characters and contain only letters, numbers, or underscores.',
          });
        }

        // Check uniqueness excluding current user
        const existingUser = await prisma.user.findFirst({
          where: {
            username: cleanUsername,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: 'Username is already taken.',
          });
        }
        updateData.username = cleanUsername;
      } else {
        updateData.username = null;
      }
    }

    // Toggle notification preference updates
    if (notifyNewTask !== undefined) updateData.notifyNewTask = !!notifyNewTask;
    if (notifyDueDate !== undefined) updateData.notifyDueDate = !!notifyDueDate;
    if (notifyOverdue !== undefined) updateData.notifyOverdue = !!notifyOverdue;
    if (notifyDailyReminder !== undefined) updateData.notifyDailyReminder = !!notifyDailyReminder;

    // Save modifications to database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        accounts: {
          select: { provider: true },
        },
      },
    });

    res.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/profile/avatar
 * Uploads a profile picture and updates user's profileImage attribute.
 */
router.post('/avatar', requireAuth, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded.',
      });
    }

    // Construct image URL path (Express serves this via static public path)
    const host = req.get('host');
    const protocol = req.protocol;
    const profileImagePath = `${protocol}://${host}/uploads/${req.file.filename}`;

    // Update in database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { profileImage: profileImagePath },
      include: {
        accounts: {
          select: { provider: true },
        },
      },
    });

    res.json({
      success: true,
      user: updatedUser,
      profileImage: profileImagePath,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
