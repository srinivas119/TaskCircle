import { Router } from 'express';
import crypto from 'crypto';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/*
|--------------------------------------------------------------------------
| CREATE GROUP
|--------------------------------------------------------------------------
| POST /api/groups
|--------------------------------------------------------------------------
*/
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, privacy } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Group name is required',
      });
    }

    const groupCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        privacy: privacy === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
        groupCode,
        creatorId: req.user.id,

        members: {
          create: {
            userId: req.user.id,
            role: 'ADMIN',
            status: 'ACTIVE',
            canAssignTasks: true,
          },
        },
      },

      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          },
        },

        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group,
    });
  } catch (error) {
    console.error('Create group error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to create group',
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET MY GROUPS
|--------------------------------------------------------------------------
| GET /api/groups
|--------------------------------------------------------------------------
*/
router.get('/', requireAuth, async (req, res) => {
  try {
    const memberships = await prisma.groupMember.findMany({
      where: {
        userId: req.user.id,
        status: 'ACTIVE',
      },

      include: {
        group: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
              },
            },

            _count: {
              select: {
                members: true,
                tasks: true,
              },
            },
          },
        },
      },

      orderBy: {
        joinedAt: 'desc',
      },
    });

    const groups = memberships.map((membership) => ({
      ...membership.group,

      role: membership.role,

      membershipStatus: membership.status,

      canAssignTasks:
        membership.role === 'ADMIN' ||
        membership.canAssignTasks === true,
    }));

    return res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error('Get groups error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch groups',
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET GROUP DETAILS
|--------------------------------------------------------------------------
| GET /api/groups/:groupId
|--------------------------------------------------------------------------
*/
router.get('/:groupId', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.id,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this group',
      });
    }

    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
      },

      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          },
        },

        members: {
          where: {
            status: 'ACTIVE',
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
              },
            },
          },

          orderBy: [
            {
              role: 'asc',
            },
            {
              joinedAt: 'asc',
            },
          ],
        },

        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
              },
            },

            creator: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },
        },

        _count: {
          select: {
            members: true,
            tasks: true,
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

    const responseGroup = {
      ...group,

      currentUserRole: membership.role,

      currentUserCanAssignTasks:
        membership.role === 'ADMIN' ||
        membership.canAssignTasks === true,

      members: group.members.map((member) => ({
        ...member,

        canAssignTasks:
          member.role === 'ADMIN' ||
          member.canAssignTasks === true,
      })),
    };

    return res.status(200).json({
      success: true,
      group: responseGroup,
    });
  } catch (error) {
    console.error('Get group details error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch group details',
    });
  }
});

/*
|--------------------------------------------------------------------------
| UPDATE GROUP
|--------------------------------------------------------------------------
| PUT /api/groups/:groupId
|--------------------------------------------------------------------------
*/
router.put('/:groupId', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, privacy } = req.body;

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.id,
        },
      },
    });

    if (
      !membership ||
      membership.status !== 'ACTIVE' ||
      membership.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Only group admin can update group details',
      });
    }

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Group name cannot be empty',
        });
      }

      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (privacy !== undefined) {
      if (!['PUBLIC', 'PRIVATE'].includes(privacy)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid privacy value',
        });
      }

      updateData.privacy = privacy;
    }

    const group = await prisma.group.update({
      where: {
        id: groupId,
      },

      data: updateData,

      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          },
        },

        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Group updated successfully',
      group,
    });
  } catch (error) {
    console.error('Update group error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to update group',
    });
  }
});

/*
|--------------------------------------------------------------------------
| UPDATE TASK ASSIGNMENT PERMISSION
|--------------------------------------------------------------------------
| PATCH /api/groups/:groupId/members/:userId/task-permission
|
| ONLY ADMIN can give/revoke permission.
|--------------------------------------------------------------------------
*/
router.patch(
  '/:groupId/members/:userId/task-permission',
  requireAuth,
  async (req, res) => {
    try {
      const { groupId, userId } = req.params;
      const { canAssignTasks } = req.body;

      if (typeof canAssignTasks !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'canAssignTasks must be true or false',
        });
      }

      const admin = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: req.user.id,
          },
        },
      });

      if (
        !admin ||
        admin.status !== 'ACTIVE' ||
        admin.role !== 'ADMIN'
      ) {
        return res.status(403).json({
          success: false,
          error: 'Only group admin can change task assignment permission',
        });
      }

      const member = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            },
          },
        },
      });

      if (!member || member.status !== 'ACTIVE') {
        return res.status(404).json({
          success: false,
          error: 'Active group member not found',
        });
      }

      if (member.role === 'ADMIN') {
        return res.status(400).json({
          success: false,
          error: 'Admin already has task assignment permission',
        });
      }

      const updatedMember = await prisma.groupMember.update({
        where: {
          id: member.id,
        },

        data: {
          canAssignTasks,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,

        message: canAssignTasks
          ? 'Task assignment permission granted'
          : 'Task assignment permission removed',

        member: {
          ...updatedMember,

          canAssignTasks:
            updatedMember.role === 'ADMIN' ||
            updatedMember.canAssignTasks === true,
        },
      });
    } catch (error) {
      console.error(
        'Update task assignment permission error:',
        error
      );

      return res.status(500).json({
        success: false,
        error: 'Failed to update task assignment permission',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| JOIN GROUP
|--------------------------------------------------------------------------
| POST /api/groups/:groupId/join
|
| PUBLIC:
|   Immediately ACTIVE
|
| PRIVATE:
|   ALWAYS PENDING
|   Admin/Moderator must approve
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| JOIN GROUP USING GROUP CODE
|--------------------------------------------------------------------------
| POST /api/groups/join
|
| Body:
| {
|   groupCode: "AB12CD34"
| }
|
| PUBLIC:
|   Join immediately
|
| PRIVATE:
|   Create pending join request
|--------------------------------------------------------------------------
*/
router.post('/join', requireAuth, async (req, res) => {
  try {
    const { groupCode } = req.body;

    if (!groupCode || !groupCode.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Group code is required',
      });
    }

    const group = await prisma.group.findUnique({
      where: {
        groupCode: groupCode.trim().toUpperCase(),
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      });
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: req.user.id,
        },
      },
    });

    if (existingMember?.status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'You are already a member of this group',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PUBLIC GROUP
    |--------------------------------------------------------------------------
    */

    if (group.privacy === 'PUBLIC') {
      const member = await prisma.groupMember.upsert({
        where: {
          groupId_userId: {
            groupId: group.id,
            userId: req.user.id,
          },
        },

        update: {
          status: 'ACTIVE',
          role: 'MEMBER',
          canAssignTasks: false,
        },

        create: {
          groupId: group.id,
          userId: req.user.id,
          role: 'MEMBER',
          status: 'ACTIVE',
          canAssignTasks: false,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Joined group successfully',
        group,
        member,
        requiresApproval: false,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE GROUP
    |--------------------------------------------------------------------------
    */

    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: req.user.id,
        },
      },
    });

    if (existingRequest?.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Join request already pending',
      });
    }

    const request = await prisma.joinRequest.upsert({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: req.user.id,
        },
      },

      update: {
        status: 'PENDING',
      },

      create: {
        groupId: group.id,
        userId: req.user.id,
        status: 'PENDING',
      },
    });

    /*
    |--------------------------------------------------------------------------
    | If an old inactive membership exists
    |--------------------------------------------------------------------------
    */

    if (existingMember) {
      await prisma.groupMember.update({
        where: {
          id: existingMember.id,
        },

        data: {
          status: 'PENDING',
          role: 'MEMBER',
          canAssignTasks: false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Join request sent. Waiting for admin approval.',
      group,
      request,
      requiresApproval: true,
    });
  } catch (error) {
    console.error('Join group by code error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to join group',
      details:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
});
router.post('/:groupId/join', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      });
    }

    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.id,
        },
      },
    });

    if (existingMember?.status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: 'You are already a member of this group',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PUBLIC GROUP
    |--------------------------------------------------------------------------
    */
    if (group.privacy === 'PUBLIC') {
      const member = await prisma.groupMember.upsert({
        where: {
          groupId_userId: {
            groupId,
            userId: req.user.id,
          },
        },

        update: {
          status: 'ACTIVE',
          role: 'MEMBER',
          canAssignTasks: false,
        },

        create: {
          groupId,
          userId: req.user.id,
          role: 'MEMBER',
          status: 'ACTIVE',
          canAssignTasks: false,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Joined group successfully',
        member,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE GROUP
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Never activate the member here.
    |
    | A private group always requires approval.
    |--------------------------------------------------------------------------
    */

    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.id,
        },
      },
    });

    if (existingRequest?.status === 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Join request already pending',
      });
    }

    const request = await prisma.joinRequest.upsert({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.id,
        },
      },

      update: {
        status: 'PENDING',
      },

      create: {
        groupId,
        userId: req.user.id,
        status: 'PENDING',
      },
    });

    /*
    |--------------------------------------------------------------------------
    | If an old inactive membership exists, keep it PENDING.
    |--------------------------------------------------------------------------
    */
    if (existingMember) {
      await prisma.groupMember.update({
        where: {
          id: existingMember.id,
        },

        data: {
          status: 'PENDING',
          role: 'MEMBER',
          canAssignTasks: false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Private group requires admin approval',
      requiresApproval: true,
      request,
    });
  } catch (error) {
    console.error('Join group error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to join group',
    });
  }
});

/*
|--------------------------------------------------------------------------
| LEAVE GROUP
|--------------------------------------------------------------------------
| DELETE /api/groups/:groupId/leave
|--------------------------------------------------------------------------
*/
router.delete('/:groupId/leave', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.id,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return res.status(404).json({
        success: false,
        error: 'You are not a member of this group',
      });
    }

    if (membership.role === 'ADMIN') {
      const adminCount = await prisma.groupMember.count({
        where: {
          groupId,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'You cannot leave while you are the only admin',
        });
      }
    }

    await prisma.groupMember.delete({
      where: {
        id: membership.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'You left the group successfully',
    });
  } catch (error) {
    console.error('Leave group error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to leave group',
    });
  }
});

/*
|--------------------------------------------------------------------------
| REMOVE MEMBER
|--------------------------------------------------------------------------
| DELETE /api/groups/:groupId/members/:userId
|--------------------------------------------------------------------------
*/
router.delete(
  '/:groupId/members/:userId',
  requireAuth,
  async (req, res) => {
    try {
      const { groupId, userId } = req.params;

      const admin = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: req.user.id,
          },
        },
      });

      if (
        !admin ||
        admin.status !== 'ACTIVE' ||
        admin.role !== 'ADMIN'
      ) {
        return res.status(403).json({
          success: false,
          error: 'Only group admin can remove members',
        });
      }

      const member = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!member || member.status !== 'ACTIVE') {
        return res.status(404).json({
          success: false,
          error: 'Member not found',
        });
      }

      if (member.role === 'ADMIN') {
        return res.status(400).json({
          success: false,
          error: 'Admin cannot be removed',
        });
      }

      await prisma.groupMember.delete({
        where: {
          id: member.id,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Member removed successfully',
      });
    } catch (error) {
      console.error('Remove member error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to remove member',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET JOIN REQUESTS
|--------------------------------------------------------------------------
| GET /api/groups/:groupId/join-requests
|--------------------------------------------------------------------------
*/
router.get(
  '/:groupId/join-requests',
  requireAuth,
  async (req, res) => {
    try {
      const { groupId } = req.params;

      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: req.user.id,
          },
        },
      });

      if (
        !membership ||
        membership.status !== 'ACTIVE' ||
        !['ADMIN', 'MODERATOR'].includes(membership.role)
      ) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view join requests',
        });
      }

      const requests = await prisma.joinRequest.findMany({
        where: {
          groupId,
          status: 'PENDING',
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
              email: true,
            },
          },
        },

        orderBy: {
          createdAt: 'asc',
        },
      });

      return res.status(200).json({
        success: true,
        requests,
      });
    } catch (error) {
      console.error('Get join requests error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch join requests',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| APPROVE JOIN REQUEST
|--------------------------------------------------------------------------
| PATCH /api/groups/:groupId/join-requests/:requestId/approve
|--------------------------------------------------------------------------
*/
router.patch(
  '/:groupId/join-requests/:requestId/approve',
  requireAuth,
  async (req, res) => {
    try {
      const { groupId, requestId } = req.params;

      const admin = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: req.user.id,
          },
        },
      });

      if (
        !admin ||
        admin.status !== 'ACTIVE' ||
        !['ADMIN', 'MODERATOR'].includes(admin.role)
      ) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to approve requests',
        });
      }

      const request = await prisma.joinRequest.findUnique({
        where: {
          id: requestId,
        },
      });

      if (!request || request.groupId !== groupId) {
        return res.status(404).json({
          success: false,
          error: 'Join request not found',
        });
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Join request is no longer pending',
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const member = await tx.groupMember.upsert({
          where: {
            groupId_userId: {
              groupId,
              userId: request.userId,
            },
          },

          update: {
            status: 'ACTIVE',
            role: 'MEMBER',
            canAssignTasks: false,
          },

          create: {
            groupId,
            userId: request.userId,
            role: 'MEMBER',
            status: 'ACTIVE',
            canAssignTasks: false,
          },
        });

        const updatedRequest = await tx.joinRequest.update({
          where: {
            id: requestId,
          },

          data: {
            status: 'APPROVED',
          },
        });

        return {
          member,
          request: updatedRequest,
        };
      });

      return res.status(200).json({
        success: true,
        message: 'Join request approved',
        ...result,
      });
    } catch (error) {
      console.error('Approve join request error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to approve join request',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| REJECT JOIN REQUEST
|--------------------------------------------------------------------------
| PATCH /api/groups/:groupId/join-requests/:requestId/reject
|--------------------------------------------------------------------------
*/
router.patch(
  '/:groupId/join-requests/:requestId/reject',
  requireAuth,
  async (req, res) => {
    try {
      const { groupId, requestId } = req.params;

      const admin = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: req.user.id,
          },
        },
      });

      if (
        !admin ||
        admin.status !== 'ACTIVE' ||
        !['ADMIN', 'MODERATOR'].includes(admin.role)
      ) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to reject requests',
        });
      }

      const request = await prisma.joinRequest.findUnique({
        where: {
          id: requestId,
        },
      });

      if (!request || request.groupId !== groupId) {
        return res.status(404).json({
          success: false,
          error: 'Join request not found',
        });
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          error: 'Join request is no longer pending',
        });
      }

      const updatedRequest = await prisma.joinRequest.update({
        where: {
          id: requestId,
        },

        data: {
          status: 'REJECTED',
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Join request rejected',
        request: updatedRequest,
      });
    } catch (error) {
      console.error('Reject join request error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to reject join request',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| CHANGE MEMBER ROLE
|--------------------------------------------------------------------------
| PATCH /api/groups/:groupId/members/:userId/role
|--------------------------------------------------------------------------
*/
router.patch(
  '/:groupId/members/:userId/role',
  requireAuth,
  async (req, res) => {
    try {
      const { groupId, userId } = req.params;
      const { role } = req.body;

      if (!['ADMIN', 'MODERATOR', 'MEMBER'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role',
        });
      }

      const admin = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: req.user.id,
          },
        },
      });

      if (
        !admin ||
        admin.status !== 'ACTIVE' ||
        admin.role !== 'ADMIN'
      ) {
        return res.status(403).json({
          success: false,
          error: 'Only group admin can change member roles',
        });
      }

      const member = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!member || member.status !== 'ACTIVE') {
        return res.status(404).json({
          success: false,
          error: 'Member not found',
        });
      }

      if (member.userId === req.user.id) {
        return res.status(400).json({
          success: false,
          error: 'You cannot change your own role',
        });
      }

      const updatedMember = await prisma.groupMember.update({
        where: {
          id: member.id,
        },

        data: {
          role,

          ...(role === 'ADMIN'
            ? { canAssignTasks: true }
            : {}),
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Member role updated successfully',

        member: {
          ...updatedMember,

          canAssignTasks:
            updatedMember.role === 'ADMIN' ||
            updatedMember.canAssignTasks === true,
        },
      });
    } catch (error) {
      console.error('Change member role error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to change member role',
      });
    }
  }
);
router.post('/:groupId/tasks/assign-all', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const {
      title,
      description,
      priority = 'MEDIUM',
      dueDate,
      link,
    } = req.body;

    console.log('ASSIGN ALL DATA:', {
      title,
      description,
      priority,
      dueDate,
      link,
      groupId,
      userId: req.user.id,
    });

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required',
      });
    }

    const group = await prisma.group.findUnique({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      });
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.id,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: 'You are not an active member of this group',
      });
    }

    if (
      membership.role !== 'ADMIN' &&
      membership.role !== 'MODERATOR'
    ) {
      return res.status(403).json({
        success: false,
        error: 'Only admins and moderators can assign tasks',
      });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task priority',
      });
    }

    const members = await prisma.groupMember.findMany({
      where: {
        groupId,
        status: 'ACTIVE',
      },
      select: {
        userId: true,
      },
    });

    if (members.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active members found',
      });
    }

    const cleanLink =
      typeof link === 'string' && link.trim()
        ? link
            .trim()
            .replace(/^\[([^\]]+)\]\([^)]+\)$/, '$1')
        : null;

    const cleanDescription =
      typeof description === 'string' && description.trim()
        ? description.trim()
        : null;

    const createdTasks = [];

    for (const member of members) {
      const task = await prisma.task.create({
        data: {
          title: title.trim(),

          description: cleanDescription,

          link: cleanLink,

          priority,

          dueDate: dueDate
            ? new Date(dueDate)
            : null,

          groupId,

          assignedTo: member.userId,

          createdBy: req.user.id,
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

    console.log(
      'ASSIGN ALL CREATED:',
      createdTasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        link: task.link,
        priority: task.priority,
        dueDate: task.dueDate,
      }))
    );

    return res.status(201).json({
      success: true,
      message: `Task assigned to ${createdTasks.length} members`,
      assignToAll: true,
      count: createdTasks.length,
      tasks: createdTasks,
    });

  } catch (error) {
    console.error('Assign all task error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to assign task to everyone',
      details:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
});
router.delete('/:groupId', requireAuth, async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found',
      });
    }

    if (group.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Only the group creator can delete this group',
      });
    }

    await prisma.group.delete({
      where: { id: groupId },
    });

    return res.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('Delete group error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to delete group',
    });
  }
});
/*
|--------------------------------------------------------------------------
| DOWNLOAD TASK REPORT
|--------------------------------------------------------------------------
| GET /api/groups/:groupId/tasks/report
|
| ADMIN / MODERATOR only
|
| Downloads all tasks as CSV and then removes
| completed tasks from the group.
|--------------------------------------------------------------------------
*/

router.get(
  '/groups/:groupId/tasks/report',
  requireAuth,
  async (req, res) => {
    try {
      const { groupId } = req.params;

      // Check current user's membership
      const member = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: req.user.id,
          },
        },
        include: {
          user: {
            select: {
              name: true,
              username: true,
            },
          },
        },
      });

      if (
        !member ||
        member.status !== 'ACTIVE'
      ) {
        return res.status(403).json({
          success: false,
          error: 'You are not an active member of this group',
        });
      }

      // Only ADMIN and MODERATOR
      if (
        member.role !== 'ADMIN' &&
        member.role !== 'MODERATOR'
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Only admin or moderator can download task reports',
        });
      }

      // Get group
      const group = await prisma.group.findUnique({
        where: {
          id: groupId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Group not found',
        });
      }

      // Get all tasks
      const tasks = await prisma.task.findMany({
        where: {
          groupId,
        },
        include: {
          assignee: {
            select: {
              name: true,
              username: true,
              email: true,
            },
          },
          creator: {
            select: {
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (tasks.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No tasks available for report',
        });
      }

      /*
      |--------------------------------------------------------------------------
      | CREATE CSV
      |--------------------------------------------------------------------------
      */

      const escapeCSV = (value) => {
        if (
          value === null ||
          value === undefined
        ) {
          return '';
        }

        const stringValue = String(value);

        return `"${stringValue.replace(/"/g, '""')}"`;
      };

      const headers = [
        'Task Name',
        'Description',
        'Member',
        'Member Email',
        'Status',
        'Priority',
        'Due Date',
        'Created By',
        'Created Date',
      ];

      const rows = tasks.map((task) => [
        task.title,
        task.description,
        task.assignee?.name ||
          task.assignee?.username ||
          'Unknown',
        task.assignee?.email || '',
        task.status,
        task.priority,
        task.dueDate
          ? task.dueDate.toISOString()
          : '',
        task.creator?.name ||
          task.creator?.username ||
          'Unknown',
        task.createdAt.toISOString(),
      ]);

      const csv = [
        headers.map(escapeCSV).join(','),
        ...rows.map((row) =>
          row.map(escapeCSV).join(',')
        ),
      ].join('\n');

      /*
      |--------------------------------------------------------------------------
      | DELETE COMPLETED TASKS
      |--------------------------------------------------------------------------
      */

      await prisma.task.deleteMany({
        where: {
          groupId,
          status: 'COMPLETED',
        },
      });

      /*
      |--------------------------------------------------------------------------
      | SEND CSV
      |--------------------------------------------------------------------------
      */

      const safeGroupName = group.name
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();

      const fileName =
        `${safeGroupName}_tasks_report.csv`;

      res.setHeader(
        'Content-Type',
        'text/csv; charset=utf-8'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`
      );

      return res.send(csv);

    } catch (error) {
      console.error(
        'Download task report error:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          'Failed to download task report',
      });
    }
  }
);
export default router;