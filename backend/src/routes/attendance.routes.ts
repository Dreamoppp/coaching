import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate, requireRoles } from '../middlewares/auth';
import { AuthRequest } from '../types';
import { Role, AttendanceStatus, AttendanceScanMethod, AbsenteeCallStatus } from '@prisma/client';
import { getSocketIO } from '../sockets/chat.socket';

const router = Router();
router.use(authenticate);

// 1. Scan QR Code Check-in
const scanSchema = z.object({
  qrData: z.string().min(1),
  batchId: z.string().optional(),
});

router.post('/scan', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qrData, batchId } = scanSchema.parse(req.body);

    // Look up student by qrCode or rollNumber or id
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { qrCode: qrData },
          { rollNumber: qrData },
          { id: qrData },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { batch: true },
        },
        parentContact: true,
      },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not recognized. Invalid QR code or token.' });
      return;
    }

    // Determine target batch
    let targetBatchId = batchId;
    if (!targetBatchId) {
      if (student.enrollments.length === 0) {
        res.status(400).json({ error: 'Student is not enrolled in any active batch.' });
        return;
      }
      targetBatchId = student.enrollments[0].batchId;
    } else {
      const isEnrolled = student.enrollments.some((e) => e.batchId === targetBatchId);
      if (!isEnrolled) {
        res.status(400).json({
          error: `Student ${student.user.name} is not enrolled in batch ${targetBatchId}.`,
        });
        return;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check for duplicate check-in today
    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        studentId_batchId_date: {
          studentId: student.id,
          batchId: targetBatchId,
          date: today,
        },
      },
    });

    const now = new Date();
    const batch = student.enrollments.find((e) => e.batchId === targetBatchId)?.batch;
    
    // Check if late based on batch start time
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    if (batch && batch.classStartTime) {
      const [startHour, startMin] = batch.classStartTime.split(':').map(Number);
      const batchTime = new Date(today);
      batchTime.setHours(startHour, startMin + 15, 0); // 15 mins grace period
      if (now > batchTime) {
        status = AttendanceStatus.LATE;
      }
    }

    if (existing && existing.status === AttendanceStatus.PRESENT) {
      res.status(409).json({
        message: 'Student already checked in today.',
        attendance: existing,
        student: {
          name: student.user.name,
          rollNumber: student.rollNumber,
          batchName: batch?.name,
          checkInTime: existing.checkInTime,
        },
      });
      return;
    }

    // Upsert attendance record
    const attendance = await prisma.attendanceRecord.upsert({
      where: {
        studentId_batchId_date: {
          studentId: student.id,
          batchId: targetBatchId,
          date: today,
        },
      },
      update: {
        status,
        checkInTime: now,
        scanMethod: AttendanceScanMethod.QR,
        verifiedBy: req.user!.name,
        absenteeCallStatus: AbsenteeCallStatus.NOT_REQUIRED,
      },
      create: {
        studentId: student.id,
        batchId: targetBatchId,
        date: today,
        status,
        checkInTime: now,
        scanMethod: AttendanceScanMethod.QR,
        verifiedBy: req.user!.name,
      },
    });

    // Broadcast attendance update via Socket.IO
    const io = getSocketIO();
    if (io) {
      io.emit('attendance_update', {
        studentId: student.id,
        studentName: student.user.name,
        rollNumber: student.rollNumber,
        batchId: targetBatchId,
        status,
        checkInTime: now,
      });
    }

    res.json({
      success: true,
      message: `Checked in successfully: ${student.user.name}`,
      attendance,
      student: {
        id: student.id,
        name: student.user.name,
        rollNumber: student.rollNumber,
        avatar: student.user.avatar,
        batchName: batch?.name,
        status,
        checkInTime: now,
      },
    });
  } catch (error: any) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Failed to process attendance check-in' });
  }
});

// 2. Absentee Workflow & 30-Minute Cutoff Alerts
router.get('/absentee-alerts', requireRoles([Role.ADMIN, Role.TEACHER]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    // Fetch batches with their students
    const batches = await prisma.batch.findMany({
      where: { isActive: true },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                parentContact: true,
              },
            },
          },
        },
      },
    });

    const absenteeList: any[] = [];

    for (const batch of batches) {
      // Calculate 30-minute cutoff from classStartTime
      const [startHour, startMin] = (batch.classStartTime || '09:00').split(':').map(Number);
      const scheduledStart = new Date(today);
      scheduledStart.setHours(startHour, startMin, 0);

      const cutoffTime = new Date(scheduledStart.getTime() + 30 * 60 * 1000); // 30 minutes after start
      const isPastCutoff = now >= cutoffTime;

      // Get attendance records for this batch today
      const todayAttendance = await prisma.attendanceRecord.findMany({
        where: {
          batchId: batch.id,
          date: today,
        },
      });

      const checkedInStudentIds = new Set(
        todayAttendance
          .filter((a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE)
          .map((a) => a.studentId)
      );

      for (const enrollment of batch.enrollments) {
        const student = enrollment.student;
        const isCheckedIn = checkedInStudentIds.has(student.id);

        if (!isCheckedIn) {
          // Find existing record if marked absent or awaiting
          const existingRecord = todayAttendance.find((a) => a.studentId === student.id);

          absenteeList.push({
            studentId: student.id,
            studentName: student.user.name,
            rollNumber: student.rollNumber,
            avatar: student.user.avatar,
            batchId: batch.id,
            batchName: batch.name,
            scheduledArrival: batch.classStartTime,
            isPastCutoff,
            minutesPastScheduled: Math.max(0, Math.round((now.getTime() - scheduledStart.getTime()) / 60000)),
            parentName: student.parentContact?.fatherName || student.parentContact?.motherName || 'Parent',
            parentPhone: student.parentContact?.whatsappNumber || student.parentContact?.fatherPhone || 'N/A',
            whatsappNumber: student.parentContact?.whatsappNumber || '',
            status: existingRecord?.status || (isPastCutoff ? AttendanceStatus.ABSENT : AttendanceStatus.AWAITING_VERIFICATION),
            callStatus: existingRecord?.absenteeCallStatus || AbsenteeCallStatus.PENDING,
            remarks: existingRecord?.absenteeRemarks || (isPastCutoff ? 'Cutoff exceeded without check-in' : 'Awaiting scheduled arrival'),
            recordId: existingRecord?.id || null,
          });
        }
      }
    }

    res.json({
      totalAbsentees: absenteeList.length,
      absentees: absenteeList,
    });
  } catch (error) {
    console.error('Error in absentee-alerts:', error);
    res.status(500).json({ error: 'Failed to fetch absentee list' });
  }
});

// 3. Update Absentee Status & Call Log
router.put('/absentee-status', requireRoles([Role.ADMIN, Role.TEACHER]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, batchId, status, callStatus, remarks } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await prisma.attendanceRecord.upsert({
      where: {
        studentId_batchId_date: {
          studentId,
          batchId,
          date: today,
        },
      },
      update: {
        status: status || AttendanceStatus.ABSENT,
        absenteeCallStatus: callStatus || AbsenteeCallStatus.CALLED_CONFIRMED,
        absenteeRemarks: remarks,
        verifiedBy: req.user!.name,
      },
      create: {
        studentId,
        batchId,
        date: today,
        status: status || AttendanceStatus.ABSENT,
        scanMethod: AttendanceScanMethod.MANUAL,
        absenteeCallStatus: callStatus || AbsenteeCallStatus.CALLED_CONFIRMED,
        absenteeRemarks: remarks,
        verifiedBy: req.user!.name,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPDATE_ABSENTEE_STATUS',
        entityType: 'ATTENDANCE',
        entityId: record.id,
        details: `Updated absentee status for student ${studentId} to ${status}, Call: ${callStatus}`,
      },
    });

    res.json({ message: 'Absentee status updated successfully', record });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update absentee status' });
  }
});

// 4. Batch Attendance by Date
router.get('/batch/:batchId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { batchId } = req.params;
    const dateQuery = req.query.date ? new Date(req.query.date as string) : new Date();
    dateQuery.setHours(0, 0, 0, 0);

    const enrollments = await prisma.enrollment.findMany({
      where: { batchId, status: 'ACTIVE' },
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
            parentContact: true,
            attendanceRecords: {
              where: { batchId, date: dateQuery },
            },
          },
        },
      },
      orderBy: { student: { rollNumber: 'asc' } },
    });

    const studentsAttendance = enrollments.map((e) => {
      const student = e.student;
      const record = student.attendanceRecords[0] || null;
      return {
        studentId: student.id,
        name: student.user.name,
        rollNumber: student.rollNumber,
        avatar: student.user.avatar,
        parentPhone: student.parentContact?.whatsappNumber,
        status: record ? record.status : 'NOT_RECORDED',
        checkInTime: record ? record.checkInTime : null,
        scanMethod: record ? record.scanMethod : null,
        callStatus: record ? record.absenteeCallStatus : null,
        remarks: record ? record.absenteeRemarks : null,
        recordId: record ? record.id : null,
      };
    });

    res.json({
      date: dateQuery,
      batchId,
      students: studentsAttendance,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batch attendance.' });
  }
});

// 5. Student Attendance History & Percentages
router.get('/student/:studentId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    // Security check: If student role, ensure student views own data
    if (req.user!.role === Role.STUDENT) {
      const myStudent = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
      if (!myStudent || myStudent.id !== studentId) {
        res.status(403).json({ error: 'Forbidden: You can only view your own attendance.' });
        return;
      }
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      include: { batch: { select: { name: true, batchCode: true } } },
      orderBy: { date: 'desc' },
      take: 60,
    });

    const totalDays = records.length;
    const presentCount = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const lateCount = records.filter((r) => r.status === AttendanceStatus.LATE).length;
    const absentCount = records.filter((r) => r.status === AttendanceStatus.ABSENT).length;

    const overallPercentage = totalDays > 0
      ? Math.round(((presentCount + lateCount) / totalDays) * 100)
      : 100;

    res.json({
      studentId,
      stats: {
        totalDays,
        presentCount,
        lateCount,
        absentCount,
        overallPercentage,
      },
      history: records,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student attendance history.' });
  }
});

export default router;
