import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireRoles } from '../middlewares/auth';
import { AuthRequest } from '../types';
import { Role, AttendanceStatus, FeeStatus, PaymentMode } from '@prisma/client';

const router = Router();
router.use(authenticate);
router.use(requireRoles([Role.ADMIN]));

// 1. Overview Statistics
router.get('/overview', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalTeachers,
      totalBatches,
      totalCourses,
      todayAttendance,
      feeStats,
      activeTests,
      recentLogs,
      recentStudents,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.batch.count({ where: { isActive: true } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { date: today },
        _count: { status: true },
      }),
      prisma.feeRecord.aggregate({
        _sum: { amount: true, paidAmount: true },
      }),
      prisma.examination.count({
        where: { examDate: { gte: today } },
      }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, role: true } } },
      }),
      prisma.student.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, avatar: true } },
          enrollments: { include: { batch: { select: { name: true } } } },
        },
      }),
    ]);

    const attendanceSummary = {
      present: todayAttendance.find((a) => a.status === AttendanceStatus.PRESENT)?._count.status || 0,
      absent: todayAttendance.find((a) => a.status === AttendanceStatus.ABSENT)?._count.status || 0,
      late: todayAttendance.find((a) => a.status === AttendanceStatus.LATE)?._count.status || 0,
    };
    const totalTodayRecords = attendanceSummary.present + attendanceSummary.absent + attendanceSummary.late;
    const attendancePercentage = totalTodayRecords > 0
      ? Math.round(((attendanceSummary.present + attendanceSummary.late) / totalTodayRecords) * 100)
      : 100;

    res.json({
      counts: {
        totalStudents,
        totalTeachers,
        totalBatches,
        totalCourses,
        activeTests,
        attendancePercentage,
        todayPresent: attendanceSummary.present,
        todayAbsent: attendanceSummary.absent,
        todayLate: attendanceSummary.late,
        totalFeesExpected: feeStats._sum.amount || 0,
        totalFeesCollected: feeStats._sum.paidAmount || 0,
        pendingFees: (feeStats._sum.amount || 0) - (feeStats._sum.paidAmount || 0),
      },
      recentLogs,
      recentStudents,
    });
  } catch (error: any) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview data.' });
  }
});

// 2. Students CRUD
router.get('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batchId, search } = req.query;
    const where: any = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { rollNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (batchId && typeof batchId === 'string') {
      where.enrollments = {
        some: { batchId },
      };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true, isActive: true } },
        parentContact: true,
        enrollments: { include: { batch: { include: { course: true } } } },
        feeRecords: true,
      },
      orderBy: { rollNumber: 'asc' },
    });

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students list.' });
  }
});

const studentCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  rollNumber: z.string().min(2),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  batchId: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  whatsappNumber: z.string().min(8),
  feeAmount: z.number().optional().default(90000),
});

router.post('/students', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = studentCreateSchema.parse(req.body);
    const defaultPassword = await bcrypt.hash('Ace@12345', 10);
    const qrCode = `ACE-QR-${parsed.rollNumber}`;

    // Create user
    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        passwordHash: defaultPassword,
        role: Role.STUDENT,
        phone: parsed.phone,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(parsed.name)}`,
      },
    });

    // Create student
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        rollNumber: parsed.rollNumber,
        qrCode,
        gender: parsed.gender,
        bloodGroup: parsed.bloodGroup,
        emergencyContact: parsed.parentPhone,
      },
    });

    // Parent contact
    await prisma.parentsContact.create({
      data: {
        studentId: student.id,
        fatherName: parsed.parentName,
        fatherPhone: parsed.parentPhone,
        whatsappNumber: parsed.whatsappNumber,
      },
    });

    // Batch enrollment
    if (parsed.batchId) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          batchId: parsed.batchId,
        },
      });

      // Initial fee record
      await prisma.feeRecord.create({
        data: {
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${parsed.rollNumber}`,
          studentId: student.id,
          batchId: parsed.batchId,
          amount: parsed.feeAmount,
          paidAmount: 0,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: FeeStatus.PENDING,
          remarks: 'Admission fee',
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'CREATE_STUDENT',
        entityType: 'STUDENT',
        entityId: student.id,
        details: `Registered student ${parsed.name} (${parsed.rollNumber})`,
      },
    });

    res.status(201).json({ message: 'Student registered successfully', student });
  } catch (error: any) {
    console.error('Error creating student:', error);
    res.status(400).json({ error: error.message || 'Failed to create student' });
  }
});

router.put('/students/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, gender, bloodGroup, isActive, parentName, parentPhone, whatsappNumber, batchId } = req.body;

    const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
    if (!student) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    await prisma.user.update({
      where: { id: student.userId },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    await prisma.student.update({
      where: { id },
      data: {
        gender: gender !== undefined ? gender : undefined,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
      },
    });

    if (parentName || parentPhone || whatsappNumber) {
      await prisma.parentsContact.upsert({
        where: { studentId: id },
        update: {
          fatherName: parentName,
          fatherPhone: parentPhone,
          whatsappNumber: whatsappNumber,
        },
        create: {
          studentId: id,
          fatherName: parentName,
          fatherPhone: parentPhone,
          whatsappNumber: whatsappNumber || '+910000000000',
        },
      });
    }

    if (batchId) {
      const existingEnrollment = await prisma.enrollment.findFirst({
        where: { studentId: id },
      });
      if (existingEnrollment) {
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { batchId },
        });
      } else {
        await prisma.enrollment.create({
          data: { studentId: id, batchId },
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_STUDENT',
        entityType: 'STUDENT',
        entityId: id,
        details: `Updated details for student ${student.rollNumber}`,
      },
    });

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student.' });
  }
});

router.delete('/students/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    // Deleting user will cascade to student, parent contact, etc.
    await prisma.user.delete({ where: { id: student.userId } });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'DELETE_STUDENT',
        entityType: 'STUDENT',
        entityId: id,
        details: `Deleted student ${student.rollNumber}`,
      },
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student.' });
  }
});

// 3. Teachers CRUD
router.get('/teachers', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true, isActive: true } },
        subjects: { include: { subject: { include: { course: true } } } },
        timetableSessions: { include: { batch: true, subject: true } },
      },
      orderBy: { employeeId: 'asc' },
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teachers.' });
  }
});

const teacherCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  employeeId: z.string().min(2),
  qualification: z.string().optional(),
  experienceYears: z.number().optional().default(0),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  subjectIds: z.array(z.string()).optional(),
});

router.post('/teachers', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = teacherCreateSchema.parse(req.body);
    const defaultPassword = await bcrypt.hash('Ace@12345', 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        passwordHash: defaultPassword,
        role: Role.TEACHER,
        phone: parsed.phone,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(parsed.name)}`,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeId: parsed.employeeId,
        qualification: parsed.qualification,
        experienceYears: parsed.experienceYears,
        specialization: parsed.specialization,
        bio: parsed.bio,
      },
    });

    if (parsed.subjectIds && parsed.subjectIds.length > 0) {
      for (const sId of parsed.subjectIds) {
        await prisma.subjectTeacher.create({
          data: {
            subjectId: sId,
            teacherId: teacher.id,
          },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'CREATE_TEACHER',
        entityType: 'TEACHER',
        entityId: teacher.id,
        details: `Registered teacher ${parsed.name} (${parsed.employeeId})`,
      },
    });

    res.status(201).json({ message: 'Teacher created successfully', teacher });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create teacher' });
  }
});

// 4. Courses & Batches & Subjects
router.get('/courses', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        subjects: true,
        batches: {
          include: {
            _count: { select: { enrollments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

router.post('/courses', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code, name, description, durationMonths, totalFees } = req.body;
    const course = await prisma.course.create({
      data: {
        code,
        name,
        description,
        durationMonths: durationMonths ? parseInt(durationMonths, 10) : 12,
        totalFees: totalFees ? parseFloat(totalFees) : 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'CREATE_COURSE',
        entityType: 'COURSE',
        entityId: course.id,
        details: `Created course ${course.name}`,
      },
    });

    res.status(201).json(course);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create course' });
  }
});

router.get('/batches', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        course: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batches.' });
  }
});

router.post('/batches', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId, name, batchCode, maxCapacity, defaultRoom, classStartTime, startDate } = req.body;
    const batch = await prisma.batch.create({
      data: {
        courseId,
        name,
        batchCode,
        maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : 40,
        defaultRoom,
        classStartTime: classStartTime || '09:00',
        startDate: startDate ? new Date(startDate) : new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'CREATE_BATCH',
        entityType: 'BATCH',
        entityId: batch.id,
        details: `Created batch ${batch.name} (${batch.batchCode})`,
      },
    });

    res.status(201).json(batch);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create batch' });
  }
});

router.get('/subjects', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        course: true,
        teachers: { include: { teacher: { include: { user: true } } } },
        chapters: { include: { notes: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects.' });
  }
});

// 5. Fee Management
router.get('/fees', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fees = await prisma.feeRecord.findMany({
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true, phone: true } },
            parentContact: true,
          },
        },
        batch: { select: { name: true, batchCode: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fee records.' });
  }
});

router.put('/fees/:id/record-payment', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { paidAmount, paymentMode, remarks } = req.body;

    const fee = await prisma.feeRecord.findUnique({ where: { id } });
    if (!fee) {
      res.status(404).json({ error: 'Fee record not found' });
      return;
    }

    const newPaidAmount = fee.paidAmount + parseFloat(paidAmount);
    const newStatus = newPaidAmount >= fee.amount ? FeeStatus.PAID : FeeStatus.PARTIAL;

    const updated = await prisma.feeRecord.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paymentMode: paymentMode || PaymentMode.UPI,
        paidDate: new Date(),
        remarks: remarks || fee.remarks,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'RECORD_FEE_PAYMENT',
        entityType: 'FEE_RECORD',
        entityId: id,
        details: `Recorded payment of ₹${paidAmount} for invoice ${fee.invoiceNumber}`,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// 6. Institute Settings
router.get('/settings', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const settings = await prisma.instituteSettings.findUnique({ where: { id: 'default' } });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load institute settings.' });
  }
});

router.put('/settings', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { instituteName, tagLine, contactEmail, contactPhone, address, lateArrivalCutoffMinutes, whatsappProvider, whatsappApiKey } = req.body;
    const updated = await prisma.instituteSettings.upsert({
      where: { id: 'default' },
      update: {
        instituteName,
        tagLine,
        contactEmail,
        contactPhone,
        address,
        lateArrivalCutoffMinutes: lateArrivalCutoffMinutes ? parseInt(lateArrivalCutoffMinutes, 10) : 30,
        whatsappProvider,
        whatsappApiKey,
      },
      create: {
        id: 'default',
        instituteName: instituteName || 'ACE Academy',
        tagLine,
        contactEmail,
        contactPhone,
        address,
        lateArrivalCutoffMinutes: lateArrivalCutoffMinutes ? parseInt(lateArrivalCutoffMinutes, 10) : 30,
        whatsappProvider,
        whatsappApiKey,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_SETTINGS',
        entityType: 'SETTINGS',
        entityId: 'default',
        details: 'Updated institute configuration settings',
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

// 7. Audit Logs
router.get('/audit-logs', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, role: true, email: true } },
      },
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

export default router;

