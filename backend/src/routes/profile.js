import { Router } from 'express';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

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

    // Update name
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Name must be a string',
        });
      }

      updateData.name = name.trim() || null;
    }

    // Update username
    if (username !== undefined) {
      if (typeof username !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Username must be a string',
        });
      }

      const cleanUsername = username.trim();

      if (cleanUsername !== '') {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

        if (!usernameRegex.test(cleanUsername)) {
          return res.status(400).json({
            success: false,
            error:
              'Username must be between 3 and 20 characters and contain only letters, numbers, or underscores.',
          });
        }

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

    // Notification preferences
    if (notifyNewTask !== undefined) {
      updateData.notifyNewTask = !!notifyNewTask;
    }

    if (notifyDueDate !== undefined) {
      updateData.notifyDueDate = !!notifyDueDate;
    }

    if (notifyOverdue !== undefined) {
      updateData.notifyOverdue = !!notifyOverdue;
    }

    if (notifyDailyReminder !== undefined) {
      updateData.notifyDailyReminder = !!notifyDailyReminder;
    }

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

export default router;