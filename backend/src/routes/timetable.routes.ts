import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireRoles } from '../middlewares/auth';
import { AuthRequest } from '../types';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticate);

// 1. Get weekly timetable for a batch
router.get('/batch/:batchId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const sessions = await prisma.timetableSession.findMany({
      where: { batchId, isActive: true },
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true, email: true, avatar: true } } } },
        batch: { select: { id: true, name: true, batchCode: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batch timetable.' });
  }
});

// 2. Get weekly timetable for current user (Teacher or Student)
router.get('/my', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (role === Role.TEACHER) {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) {
        res.status(404).json({ error: 'Teacher record not found.' });
        return;
      }

      const sessions = await prisma.timetableSession.findMany({
        where: { teacherId: teacher.id, isActive: true },
        include: {
          subject: true,
          batch: true,
          teacher: { include: { user: { select: { name: true } } } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
      res.json(sessions);
      return;
    }

    if (role === Role.STUDENT) {
      const student = await prisma.student.findUnique({
        where: { userId },
        include: { enrollments: { where: { status: 'ACTIVE' } } },
      });

      if (!student || student.enrollments.length === 0) {
        res.json([]);
        return;
      }

      const batchIds = student.enrollments.map((e) => e.batchId);
      const sessions = await prisma.timetableSession.findMany({
        where: { batchId: { in: batchIds }, isActive: true },
        include: {
          subject: true,
          teacher: { include: { user: { select: { name: true, avatar: true } } } },
          batch: true,
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });
      res.json(sessions);
      return;
    }

    // Admin can see all or specified batch
    const sessions = await prisma.timetableSession.findMany({
      where: { isActive: true },
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
        batch: true,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load timetable.' });
  }
});

// 3. Create or Update Timetable Session with Conflict Validation
const sessionSchema = z.object({
  id: z.string().optional(),
  batchId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  dayOfWeek: z.number().min(1).max(7), // 1 = Mon ... 7 = Sun
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:MM'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format HH:MM'),
  roomNumber: z.string().min(1),
});

// Conflict check helper: checks if two time intervals overlap
function isTimeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA;
}

router.post('/', requireRoles([Role.ADMIN, Role.TEACHER]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = sessionSchema.parse(req.body);

    // 1. Check teacher conflict on the same day
    const teacherExistingSessions = await prisma.timetableSession.findMany({
      where: {
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek,
        isActive: true,
        id: data.id ? { not: data.id } : undefined,
      },
      include: { batch: true },
    });

    for (const s of teacherExistingSessions) {
      if (isTimeOverlap(data.startTime, data.endTime, s.startTime, s.endTime)) {
        res.status(409).json({
          error: `Teacher schedule conflict! The teacher is already teaching batch ${s.batch.name} from ${s.startTime} to ${s.endTime}.`,
        });
        return;
      }
    }

    // 2. Check room conflict on the same day
    const roomExistingSessions = await prisma.timetableSession.findMany({
      where: {
        roomNumber: data.roomNumber,
        dayOfWeek: data.dayOfWeek,
        isActive: true,
        id: data.id ? { not: data.id } : undefined,
      },
      include: { batch: true },
    });

    for (const s of roomExistingSessions) {
      if (isTimeOverlap(data.startTime, data.endTime, s.startTime, s.endTime)) {
        res.status(409).json({
          error: `Room conflict! ${data.roomNumber} is already reserved for batch ${s.batch.name} from ${s.startTime} to ${s.endTime}.`,
        });
        return;
      }
    }

    // 3. Check batch conflict on the same day
    const batchExistingSessions = await prisma.timetableSession.findMany({
      where: {
        batchId: data.batchId,
        dayOfWeek: data.dayOfWeek,
        isActive: true,
        id: data.id ? { not: data.id } : undefined,
      },
      include: { subject: true },
    });

    for (const s of batchExistingSessions) {
      if (isTimeOverlap(data.startTime, data.endTime, s.startTime, s.endTime)) {
        res.status(409).json({
          error: `Batch timing conflict! This batch already has ${s.subject.name} scheduled from ${s.startTime} to ${s.endTime}.`,
        });
        return;
      }
    }

    // Upsert or create
    let session;
    if (data.id) {
      session = await prisma.timetableSession.update({
        where: { id: data.id },
        data: {
          batchId: data.batchId,
          subjectId: data.subjectId,
          teacherId: data.teacherId,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
          roomNumber: data.roomNumber,
        },
      });
    } else {
      session = await prisma.timetableSession.create({
        data: {
          batchId: data.batchId,
          subjectId: data.subjectId,
          teacherId: data.teacherId,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
          roomNumber: data.roomNumber,
        },
      });
    }

    res.json({ message: 'Timetable session saved successfully.', session });
  } catch (error: any) {
    console.error('Timetable save error:', error);
    res.status(400).json({ error: error.message || 'Failed to save timetable session' });
  }
});

// 4. Delete session
router.delete('/:id', requireRoles([Role.ADMIN, Role.TEACHER]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.timetableSession.delete({ where: { id } });
    res.json({ message: 'Session removed successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;

