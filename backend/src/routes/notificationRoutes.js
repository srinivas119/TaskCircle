import express from 'express';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET NOTIFICATIONS
|--------------------------------------------------------------------------
| GET /api/notifications
|--------------------------------------------------------------------------
*/

router.get(
  '/notifications',
  requireAuth,
  async (req, res) => {
    try {
      const notifications =
        await prisma.notification.findMany({
          where: {
            userId: req.user.id,
          },

          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },

          take: 50,
        });

      const unreadCount =
        await prisma.notification.count({
          where: {
            userId: req.user.id,
            isRead: false,
          },
        });

      return res.status(200).json({
        success: true,
        notifications,
        unreadCount,
      });
    } catch (error) {
      console.error(
        'Get notifications error:',
        error
      );

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| MARK ONE NOTIFICATION AS READ
|--------------------------------------------------------------------------
| PATCH /api/notifications/:notificationId/read
|--------------------------------------------------------------------------
*/

router.patch(
  '/notifications/:notificationId/read',
  requireAuth,
  async (req, res) => {
    try {
      const { notificationId } =
        req.params;

      const notification =
        await prisma.notification.findFirst({
          where: {
            id: notificationId,
            userId: req.user.id,
          },
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found',
        });
      }

      const updatedNotification =
        await prisma.notification.update({
          where: {
            id: notificationId,
          },

          data: {
            isRead: true,
          },
        });

      return res.status(200).json({
        success: true,
        notification:
          updatedNotification,
      });
    } catch (error) {
      console.error(
        'Mark notification read error:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to update notification',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| MARK ALL NOTIFICATIONS AS READ
|--------------------------------------------------------------------------
| PATCH /api/notifications/read-all
|--------------------------------------------------------------------------
*/

router.patch(
  '/notifications/read-all',
  requireAuth,
  async (req, res) => {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: req.user.id,
          isRead: false,
        },

        data: {
          isRead: true,
        },
      });

      return res.status(200).json({
        success: true,
        message:
          'All notifications marked as read',
      });
    } catch (error) {
      console.error(
        'Mark all notifications read error:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to update notifications',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE NOTIFICATION
|--------------------------------------------------------------------------
| DELETE /api/notifications/:notificationId
|--------------------------------------------------------------------------
*/

router.delete(
  '/notifications/:notificationId',
  requireAuth,
  async (req, res) => {
    try {
      const { notificationId } =
        req.params;

      const notification =
        await prisma.notification.findFirst({
          where: {
            id: notificationId,
            userId: req.user.id,
          },
        });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found',
        });
      }

      await prisma.notification.delete({
        where: {
          id: notificationId,
        },
      });

      return res.status(200).json({
        success: true,
        message:
          'Notification deleted',
      });
    } catch (error) {
      console.error(
        'Delete notification error:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to delete notification',
      });
    }
  }
);

export default router;