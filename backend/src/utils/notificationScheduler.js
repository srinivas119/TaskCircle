import cron from 'node-cron';
import prisma from '../config/db.js';
import { createNotification } from './notificationService.js';

const getStartOfDay = (date) => {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
};

const getEndOfDay = (date) => {
  const result = new Date(date);

  result.setHours(23, 59, 59, 999);

  return result;
};

export const checkTaskNotifications = async () => {
  try {
    const now = new Date();

    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowStart =
      getStartOfDay(tomorrow);

    const tomorrowEnd =
      getEndOfDay(tomorrow);

    /*
    |--------------------------------------------------------------------------
    | Get unfinished tasks
    |--------------------------------------------------------------------------
    */

    const tasks = await prisma.task.findMany({
      where: {
        status: {
          not: 'COMPLETED',
        },

        dueDate: {
          not: null,
        },
      },

      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            username: true,
            notifyDueDate: true,
            notifyOverdue: true,
            notifyDailyReminder: true,
          },
        },
      },
    });

    for (const task of tasks) {
      if (!task.dueDate) {
        continue;
      }

      const dueDate = new Date(task.dueDate);

      /*
      |--------------------------------------------------------------------------
      | DUE TODAY
      |--------------------------------------------------------------------------
      */

      if (
        dueDate >= todayStart &&
        dueDate <= todayEnd
      ) {
        if (task.assignee.notifyDueDate) {
          await createNotification({
            userId: task.assignee.id,
            taskId: task.id,
            type: 'DUE_TODAY',
            title: 'Task Due Today',
            message: `"${task.title}" is due today.`,
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | DUE TOMORROW
      |--------------------------------------------------------------------------
      */

      if (
        dueDate >= tomorrowStart &&
        dueDate <= tomorrowEnd
      ) {
        if (task.assignee.notifyDueDate) {
          await createNotification({
            userId: task.assignee.id,
            taskId: task.id,
            type: 'DUE_TOMORROW',
            title: 'Task Due Tomorrow',
            message: `"${task.title}" is due tomorrow.`,
          });
        }
      }

      /*
      |--------------------------------------------------------------------------
      | OVERDUE
      |--------------------------------------------------------------------------
      */

      if (dueDate < todayStart) {
        if (task.assignee.notifyOverdue) {
          await createNotification({
            userId: task.assignee.id,
            taskId: task.id,
            type: 'OVERDUE',
            title: 'Task Overdue',
            message: `"${task.title}" is overdue.`,
          });
        }
      }
    }

    console.log(
      `🔔 Task notification check completed at ${now.toLocaleString()}`
    );
  } catch (error) {
    console.error(
      'Task notification scheduler error:',
      error
    );
  }
};

/*
|--------------------------------------------------------------------------
| Run every hour
|--------------------------------------------------------------------------
*/

export const startNotificationScheduler = () => {
  cron.schedule(
    '0 * * * *',
    async () => {
      console.log(
        '🔔 Running task notification scheduler...'
      );

      await checkTaskNotifications();
    },
    {
      timezone: 'Asia/Kolkata',
    }
  );

  console.log(
    '✅ Task notification scheduler started'
  );

  /*
  | Run once immediately when server starts
  */

  checkTaskNotifications();
};