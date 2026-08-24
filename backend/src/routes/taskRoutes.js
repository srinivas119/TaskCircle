import express from 'express';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CREATE TASK
|--------------------------------------------------------------------------
| POST /api/tasks
|
| Body:
| {
|   title,
|   description,
|   priority,
|   dueDate,
|   groupId,
|   assignedTo,
|   assignToAll,
|   link
| }
|
| assignToAll = true
|   -> task is assigned to every active group member
|
| assignToAll = false
|   -> task is assigned to selected member
|--------------------------------------------------------------------------
*/

router.post('/tasks', requireAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'MEDIUM',
      dueDate,
      groupId,
      assignedTo,
      assignToAll = false,
      link,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required',
      });
    }

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: 'Group ID is required',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Find group
    |--------------------------------------------------------------------------
    */

    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
      },
      include: {
        members: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check creator/admin/moderator permission
    |--------------------------------------------------------------------------
    */

    const currentMember = group.members.find(
      (member) => member.userId === req.user.id
    );

    if (!currentMember) {
      return res.status(403).json({
        success: false,
        error: 'You are not an active member of this group',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Assignment permission
    |--------------------------------------------------------------------------
    |
    | ADMIN:
    |   Can always assign tasks.
    |
    | MODERATOR:
    |   Can assign tasks.
    |
    | MEMBER:
    |   Cannot assign tasks.
    |
    */

    if (
      currentMember.role !== 'ADMIN' &&
      currentMember.role !== 'MODERATOR'
    ) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to assign tasks',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate priority
    |--------------------------------------------------------------------------
    */

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task priority',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN TO EVERYONE
    |--------------------------------------------------------------------------
    */

    if (assignToAll === true) {
      if (group.members.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No active members found in this group',
        });
      }

      const createdTasks = [];

      for (const member of group.members) {
        const task = await prisma.task.create({
          data: {
            title: title.trim(),
            description: description?.trim() || null,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            groupId: group.id,
            assignedTo: member.userId,
            createdBy: req.user.id,
            link: link?.trim() || null,
          },
          include: {
            group: {
              select: {
                id: true,
                name: true,
                groupCode: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        createdTasks.push(task);

        /*
        |--------------------------------------------------------------------------
        | Notification
        |--------------------------------------------------------------------------
        */

        if (member.userId !== req.user.id) {
          await prisma.notification.create({
            data: {
              userId: member.userId,
              taskId: task.id,
              type: 'NEW_TASK',
              title: 'New Task Assigned',
              message: `${req.user.name || 'Someone'} assigned you "${task.title}" in ${group.name}`,
            },
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Task assigned to all group members',
        assignToAll: true,
        count: createdTasks.length,
        tasks: createdTasks,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN TO ONE USER
    |--------------------------------------------------------------------------
    */

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        error: 'Please select a member or choose "Assign to everyone"',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Check selected user is an active group member
    |--------------------------------------------------------------------------
    */

    const selectedMember = group.members.find(
      (member) => member.userId === assignedTo
    );

    if (!selectedMember) {
      return res.status(400).json({
        success: false,
        error: 'Selected user is not an active member of this group',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create task
    |--------------------------------------------------------------------------
    */

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        groupId: group.id,
        assignedTo: selectedMember.userId,
        createdBy: req.user.id,
        link: link?.trim() || null,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            groupCode: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    /*
    |--------------------------------------------------------------------------
    | Notification
    |--------------------------------------------------------------------------
    */

    if (selectedMember.userId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: selectedMember.userId,
          taskId: task.id,
          type: 'NEW_TASK',
          title: 'New Task Assigned',
          message: `${req.user.name || 'Someone'} assigned you "${task.title}" in ${group.name}`,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      assignToAll: false,
      task,
    });
  } catch (error) {
    console.error('Create task error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to create task',
      details:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET MY TASKS
|--------------------------------------------------------------------------
| GET /api/tasks/my
|--------------------------------------------------------------------------
*/

router.get('/tasks/my', requireAuth, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assignedTo: req.user.id,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            groupCode: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error('Get my tasks error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET GROUP TASKS
|--------------------------------------------------------------------------
| GET /api/tasks/group/:groupId
|--------------------------------------------------------------------------
*/

router.get('/tasks/group/:groupId', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.id,
        },
      },
    });

    if (!member || member.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'You are not an active member of this group',
      });
    }

    const tasks = await prisma.task.findMany({
      where: {
        groupId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error('Get group tasks error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch group tasks',
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET SINGLE TASK
|--------------------------------------------------------------------------
| GET /api/tasks/:taskId
|--------------------------------------------------------------------------
*/

router.get('/tasks/:taskId', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            groupCode: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Only group members can view task
    |--------------------------------------------------------------------------
    */

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: task.groupId,
          userId: req.user.id,
        },
      },
    });

    if (!member || member.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this task',
      });
    }

    return res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Get task error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
    });
  }
});

/*
|--------------------------------------------------------------------------
| UPDATE TASK
|--------------------------------------------------------------------------
| PUT /api/tasks/:taskId
|--------------------------------------------------------------------------
*/

router.patch('/tasks/:taskId', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      link,
    } = req.body;

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | User must be group member
    |--------------------------------------------------------------------------
    */

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: task.groupId,
          userId: req.user.id,
        },
      },
    });

    if (!member || member.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'You are not an active member of this group',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Permission
    |--------------------------------------------------------------------------
    |
    | Assignee can update status.
    | Admin/moderator can update everything.
    |
    */

    const isAdminOrModerator =
      member.role === 'ADMIN' || member.role === 'MODERATOR';

    const isAssignee = task.assignedTo === req.user.id;

    if (!isAdminOrModerator && !isAssignee) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to update this task',
      });
    }

    const updateData = {};

    if (isAdminOrModerator) {
      if (title !== undefined) {
        updateData.title = title.trim();
      }

      if (description !== undefined) {
        updateData.description = description?.trim() || null;
      }

      if (priority !== undefined) {
        updateData.priority = priority;
      }

      if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
      }

      if (link !== undefined) {
        updateData.link = link?.trim() || null;
      }
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: updateData,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            groupCode: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    console.error('Update task error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to update task',
    });
  }
});

/*
|--------------------------------------------------------------------------
| DELETE TASK
|--------------------------------------------------------------------------
| DELETE /api/tasks/:taskId
|--------------------------------------------------------------------------
*/

router.delete('/tasks/:taskId', requireAuth, async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
      });
    }

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: task.groupId,
          userId: req.user.id,
        },
      },
    });

    if (!member || member.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'You are not an active member of this group',
      });
    }

    if (
      member.role !== 'ADMIN' &&
      member.role !== 'MODERATOR'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Only admins and moderators can delete tasks',
      });
    }

    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Delete task error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to delete task',
    });
  }
});

export default router;