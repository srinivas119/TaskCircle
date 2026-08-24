import prisma from '../config/db.js';

export const createNotification = async ({
  userId,
  taskId,
  type,
  title,
  message,
}) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const existingNotification =
      await prisma.notification.findFirst({
        where: {
          userId,
          taskId,
          type,
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      });

    if (existingNotification) {
      return existingNotification;
    }

    const notification =
      await prisma.notification.create({
        data: {
          userId,
          taskId,
          type,
          title,
          message,
        },
      });

    return notification;
  } catch (error) {
    console.error(
      'Create notification error:',
      error
    );

    return null;
  }
};