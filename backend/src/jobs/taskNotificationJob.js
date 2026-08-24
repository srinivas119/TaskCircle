import cron from 'node-cron';
import prisma from '../config/db.js';
import { createNotification } from '../utils/notificationService.js';

function getISTDate() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find(
    (p) => p.type === 'year'
  ).value;

  const month = parts.find(
    (p) => p.type === 'month'
  ).value;

  const day = parts.find(
    (p) => p.type === 'day'
  ).value;

  return new Date(
    `${year}-${month}-${day}T00:00:00+05:30`
  );
}

function getDateRange(date) {
  const start = new Date(date);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
  };
}

async function notificationAlreadyExists(
  userId,
  taskId,
  type,
  start,
  end
) {
  const existing =
    await prisma.notification.findFirst({
      where: {
        userId,
        taskId,
        type,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    });

  return !!existing;
}

async function processTaskNotifications() {
  try {
    console.log(
      '🔔 Checking task due-date notifications...'
    );

    /*
    |--------------------------------------------------------------------------
    | GET TODAY IN INDIA TIME
    |--------------------------------------------------------------------------
    */

    const today = getISTDate();

    /*
    |--------------------------------------------------------------------------
    | TOMORROW
    |--------------------------------------------------------------------------
    */

    const tomorrow = new Date(today);
    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    /*
    |--------------------------------------------------------------------------
    | DAY AFTER TOMORROW
    |--------------------------------------------------------------------------
    */

    const dayAfterTomorrow =
      new Date(today);

    dayAfterTomorrow.setDate(
      dayAfterTomorrow.getDate() + 2
    );

    console.log(
      '📅 Today:',
      today.toISOString()
    );

    console.log(
      '📅 Tomorrow:',
      tomorrow.toISOString()
    );

    /*
    |--------------------------------------------------------------------------
    | 1. OVERDUE TASKS
    |--------------------------------------------------------------------------
    */

    const overdueTasks =
      await prisma.task.findMany({
        where: {
          dueDate: {
            lt: today,
          },

          status: {
            not: 'COMPLETED',
          },
        },

        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              notifyOverdue: true,
            },
          },
        },
      });

    for (const task of overdueTasks) {
      if (!task.assignee) {
        continue;
      }

      if (!task.assignee.notifyOverdue) {
        continue;
      }

      const {
        start,
        end,
      } = getDateRange(today);

      const exists =
        await notificationAlreadyExists(
          task.assignee.id,
          task.id,
          'OVERDUE',
          start,
          end
        );

      if (exists) {
        continue;
      }

      await createNotification({
        userId: task.assignee.id,
        taskId: task.id,
        type: 'OVERDUE',
        title: 'Task Overdue',
        message:
          `Your task "${task.title}" is overdue.`,
      });

      console.log(
        `🚨 OVERDUE notification created: ${task.title}`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 2. TASKS DUE TODAY
    |--------------------------------------------------------------------------
    */

    const todayTasks =
      await prisma.task.findMany({
        where: {
          dueDate: {
            gte: today,
            lt: tomorrow,
          },

          status: {
            not: 'COMPLETED',
          },
        },

        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              notifyDueDate: true,
            },
          },
        },
      });

    for (const task of todayTasks) {
      if (!task.assignee) {
        continue;
      }

      if (!task.assignee.notifyDueDate) {
        continue;
      }

      const {
        start,
        end,
      } = getDateRange(today);

      const exists =
        await notificationAlreadyExists(
          task.assignee.id,
          task.id,
          'DUE_TODAY',
          start,
          end
        );

      if (exists) {
        continue;
      }

      await createNotification({
        userId: task.assignee.id,
        taskId: task.id,
        type: 'DUE_TODAY',
        title: 'Task Due Today',
        message:
          `Your task "${task.title}" is due today.`,
      });

      console.log(
        `📅 DUE TODAY notification created: ${task.title}`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 3. TASKS DUE TOMORROW
    |--------------------------------------------------------------------------
    */

    const tomorrowTasks =
      await prisma.task.findMany({
        where: {
          dueDate: {
            gte: tomorrow,
            lt: dayAfterTomorrow,
          },

          status: {
            not: 'COMPLETED',
          },
        },

        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              notifyDueDate: true,
            },
          },
        },
      });

    for (const task of tomorrowTasks) {
      if (!task.assignee) {
        continue;
      }

      if (!task.assignee.notifyDueDate) {
        continue;
      }

      /*
      |----------------------------------------------------------------------
      | Important:
      | We check today's notification window.
      | This prevents 9 AM and 5 PM from creating duplicates.
      |----------------------------------------------------------------------
      */

      const {
        start,
        end,
      } = getDateRange(today);

      const exists =
        await notificationAlreadyExists(
          task.assignee.id,
          task.id,
          'DUE_TOMORROW',
          start,
          end
        );

      if (exists) {
        continue;
      }

      await createNotification({
        userId: task.assignee.id,
        taskId: task.id,
        type: 'DUE_TOMORROW',
        title: 'Task Due Tomorrow',
        message:
          `Your task "${task.title}" is due tomorrow.`,
      });

      console.log(
        `📅 DUE TOMORROW notification created: ${task.title}`
      );
    }

    console.log(
      '✅ Task notification check completed'
    );
  } catch (error) {
    console.error(
      '❌ Task notification job error:',
      error
    );
  }
}

/*
|--------------------------------------------------------------------------
| SCHEDULE
|--------------------------------------------------------------------------
|
| 09:00 AM IST
| 05:00 PM IST
|
*/

cron.schedule(
  '0 9,17 * * *',
  async () => {
    console.log(
      '⏰ Running scheduled task notification check...'
    );

    await processTaskNotifications();
  },
  {
    timezone: 'Asia/Kolkata',
  }
);

console.log(
  '⏰ Task notification scheduler started'
);

console.log(
  '⏰ Notifications scheduled for 9:00 AM and 5:00 PM IST'
);

export default processTaskNotifications;