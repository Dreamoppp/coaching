import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireRoles } from '../middlewares/auth';
import { AuthRequest } from '../types';
import { Role, ExamType, NotificationType } from '@prisma/client';

const router = Router();
router.use(authenticate);

// 1. Get examinations list
router.get('/examinations', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batchId, isPublished } = req.query;
    const where: any = {};

    if (batchId && typeof batchId === 'string') {
      where.batchId = batchId;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished === 'true';
    }

    // If student, only show published exams for their enrolled batches
    if (req.user!.role === Role.STUDENT) {
      where.isPublished = true;
      const student = await prisma.student.findUnique({
        where: { userId: req.user!.userId },
        include: { enrollments: true },
      });
      if (student) {
        where.batchId = { in: student.enrollments.map((e) => e.batchId) };
      }
    }

    const exams = await prisma.examination.findMany({
      where,
      include: {
        batch: { select: { id: true, name: true, batchCode: true } },
        subject: { select: { id: true, name: true, code: true, colorHex: true } },
        _count: { select: { results: true } },
      },
      orderBy: { examDate: 'desc' },
    });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch examinations' });
  }
});

// 2. Create Examination (Admin or Teacher)
const examCreateSchema = z.object({
  title: z.string().min(3),
  examType: z.nativeEnum(ExamType).default(ExamType.UNIT_TEST),
  courseId: z.string().min(1),
  batchId: z.string().min(1),
  subjectId: z.string().min(1),
  examDate: z.string(),
  totalMarks: z.number().positive().default(100.0),
  passingMarks: z.number().positive().default(40.0),
});

router.post('/examinations', requireRoles([Role.ADMIN, Role.TEACHER]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = examCreateSchema.parse(req.body);

    const exam = await prisma.examination.create({
      data: {
        title: data.title,
        examType: data.examType,
        courseId: data.courseId,
        batchId: data.batchId,
        subjectId: data.subjectId,
        examDate: new Date(data.examDate),
        totalMarks: data.totalMarks,
        passingMarks: data.passingMarks,
        isPublished: false,
      },
      include: {
        batch: true,
        subject: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'CREATE_EXAMINATION',
        entityType: 'EXAMINATION',
        entityId: exam.id,
        details: `Created exam "${exam.title}" for batch ${exam.batch.name}`,
      },
    });

    res.status(201).json(exam);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create examination' });
  }
});

// 3. Get results for an examination
router.get('/examinations/:id/results', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const exam = await prisma.examination.findUnique({
      where: { id },
      include: {
        batch: true,
        subject: true,
        results: {
          include: {
            student: {
              include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
              },
            },
          },
          orderBy: { marksObtained: 'desc' },
        },
      },
    });

    if (!exam) {
      res.status(404).json({ error: 'Examination not found' });
      return;
    }

    // If student, check if published and filter to only their result
    if (req.user!.role === Role.STUDENT) {
      if (!exam.isPublished) {
        res.status(403).json({ error: 'Examination results are not yet published.' });
        return;
      }
      const myStudent = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
      const myResult = exam.results.find((r) => r.studentId === myStudent?.id);

      res.json({
        exam: {
          id: exam.id,
          title: exam.title,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          examDate: exam.examDate,
          subject: exam.subject,
        },
        myResult,
      });
      return;
    }

    // Admin/Teacher sees full results and summary statistics
    const totalSubmissions = exam.results.length;
    const marksList = exam.results.map((r) => r.marksObtained);
    const averageMarks = totalSubmissions > 0
      ? marksList.reduce((acc, m) => acc + m, 0) / totalSubmissions
      : 0;
    const highestMarks = totalSubmissions > 0 ? Math.max(...marksList) : 0;
    const lowestMarks = totalSubmissions > 0 ? Math.min(...marksList) : 0;
    const passedCount = exam.results.filter((r) => r.marksObtained >= exam.passingMarks).length;

    res.json({
      exam,
      stats: {
        totalSubmissions,
        averageMarks: Number(averageMarks.toFixed(1)),
        highestMarks,
        lowestMarks,
        passedCount,
        passPercentage: totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0,
      },
      results: exam.results,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// 4. Save/Update Results in Bulk (with Rank & Percentile auto calculation!)
const bulkMarksSchema = z.object({
  results: z.array(
    z.object({
      studentId: z.string(),
      marksObtained: z.number().min(0),
      remarks: z.string().optional(),
    })
  ),
});

router.post('/examinations/:id/results', requireRoles([Role.ADMIN, Role.TEACHER]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { results } = bulkMarksSchema.parse(req.body);

    const exam = await prisma.examination.findUnique({ where: { id } });
    if (!exam) {
      res.status(404).json({ error: 'Examination not found' });
      return;
    }

    // Sort by marks descending to calculate ranks and percentiles
    const sorted = [...results].sort((a, b) => b.marksObtained - a.marksObtained);
    const totalStudents = sorted.length;

    const savedRecords: any[] = [];
    for (let index = 0; index < sorted.length; index++) {
      const item = sorted[index];
      const rank = index + 1;
      // Percentile formula: (number of values below x / total) * 100
      const belowCount = sorted.filter((s) => s.marksObtained < item.marksObtained).length;
      const percentile = totalStudents > 1
        ? Number(((belowCount / (totalStudents - 1)) * 100).toFixed(1))
        : 100.0;

      const record = await prisma.examResult.upsert({
        where: {
          examinationId_studentId: {
            examinationId: id,
            studentId: item.studentId,
          },
        },
        update: {
          marksObtained: item.marksObtained,
          rank,
          percentile,
          remarks: item.remarks,
        },
        create: {
          examinationId: id,
          studentId: item.studentId,
          marksObtained: item.marksObtained,
          rank,
          percentile,
          remarks: item.remarks,
        },
      });
      savedRecords.push(record);
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_EXAM_MARKS',
        entityType: 'EXAMINATION',
        entityId: id,
        details: `Saved marks for ${savedRecords.length} students in exam "${exam.title}"`,
      },
    });

    res.json({ message: 'Marks updated successfully', count: savedRecords.length });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to save marks' });
  }
});

// 5. Publish Results
router.put('/examinations/:id/publish', requireRoles([Role.ADMIN, Role.TEACHER]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const exam = await prisma.examination.update({
      where: { id },
      data: { isPublished: isPublished !== undefined ? isPublished : true },
      include: {
        batch: { include: { enrollments: { include: { student: { include: { user: true } } } } } },
      },
    });

    // Notify enrolled students
    if (exam.isPublished) {
      for (const enrollment of exam.batch.enrollments) {
        await prisma.notification.create({
          data: {
            userId: enrollment.student.userId,
            batchId: exam.batchId,
            title: 'Results Published',
            message: `Marks for exam "${exam.title}" have been officially published. Check your scorecard.`,
            type: NotificationType.MARKS,
          },
        });
      }
    }

    res.json({ message: `Results ${exam.isPublished ? 'published' : 'unpublished'} successfully`, exam });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update publish state' });
  }
});

// 6. Student Comprehensive Performance Analytics
router.get('/student/:studentId/analytics', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    // Security check
    if (req.user!.role === Role.STUDENT) {
      const myStudent = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
      if (!myStudent || myStudent.id !== studentId) {
        res.status(403).json({ error: 'Forbidden: You can only view your own analytics' });
        return;
      }
    }

    // Get all published results for this student
    const results = await prisma.examResult.findMany({
      where: {
        studentId,
        examination: { isPublished: true },
      },
      include: {
        examination: {
          include: {
            subject: true,
            batch: true,
          },
        },
      },
      orderBy: { examination: { examDate: 'asc' } },
    });

    // Subject-wise breakdown
    const subjectMap: Record<string, { totalMarksObtained: number; totalMaxMarks: number; count: number; name: string; color: string }> = {};

    results.forEach((r) => {
      const s = r.examination.subject;
      if (!subjectMap[s.id]) {
        subjectMap[s.id] = {
          name: s.name,
          color: s.colorHex,
          totalMarksObtained: 0,
          totalMaxMarks: 0,
          count: 0,
        };
      }
      subjectMap[s.id].totalMarksObtained += r.marksObtained;
      subjectMap[s.id].totalMaxMarks += r.examination.totalMarks;
      subjectMap[s.id].count += 1;
    });

    const subjectAnalytics = Object.values(subjectMap).map((item) => ({
      subject: item.name,
      color: item.color,
      percentage: Math.round((item.totalMarksObtained / item.totalMaxMarks) * 100),
      testsTaken: item.count,
    }));

    // Chronological test performance progression
    const timelineData = results.map((r) => ({
      examTitle: r.examination.title,
      subject: r.examination.subject.name,
      date: r.examination.examDate.toISOString().slice(0, 10),
      marksObtained: r.marksObtained,
      totalMarks: r.examination.totalMarks,
      percentage: Math.round((r.marksObtained / r.examination.totalMarks) * 100),
      rank: r.rank,
      percentile: r.percentile,
    }));

    // Overall metrics
    const totalTests = results.length;
    const overallAvg = totalTests > 0
      ? Math.round(results.reduce((acc, r) => acc + (r.marksObtained / r.examination.totalMarks) * 100, 0) / totalTests)
      : 0;

    res.json({
      studentId,
      overallAverage: overallAvg,
      totalTestsTaken: totalTests,
      subjectAnalytics,
      timelineData,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

export default router;

