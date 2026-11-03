import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireRoles } from '../middlewares/auth';
import { AuthRequest } from '../types';
import { Role, NotificationType } from '@prisma/client';
import { getSocketIO } from '../sockets/chat.socket';

const router = Router();
router.use(authenticate);

// 1. Get user notifications
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let batchIds: string[] = [];
    if (role === Role.STUDENT) {
      const student = await prisma.student.findUnique({
        where: { userId },
        include: { enrollments: true },
      });
      if (student) {
        batchIds = student.enrollments.map((e) => e.batchId);
      }
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { userId: null, batchId: null }, // Global announcements
          batchIds.length > 0 ? { batchId: { in: batchIds } } : {},
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// 2. Broadcast Announcement (Admin / Teacher)
const broadcastSchema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
  type: z.nativeEnum(NotificationType).default(NotificationType.ANNOUNCEMENT),
  batchId: z.string().optional(),
});

router.post('/broadcast', requireRoles([Role.ADMIN, Role.TEACHER]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, type, batchId } = broadcastSchema.parse(req.body);

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        batchId: batchId || null,
        userId: null,
      },
    });

    // Emit live alert via Socket.IO
    const io = getSocketIO();
    if (io) {
      io.emit('new_announcement', notification);
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'BROADCAST_ANNOUNCEMENT',
        entityType: 'NOTIFICATION',
        entityId: notification.id,
        details: `Published announcement "${title}" ${batchId ? `to batch ${batchId}` : 'to all'}`,
      },
    });

    res.status(201).json(notification);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to broadcast announcement' });
  }
});

// 3. Mark as Read
router.put('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

export default router;

