import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import prisma from '../prisma';

describe('ACE Academy Backend Test Suite', () => {
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let testStudentId: string;
  let testBatchId: string;
  let testCourseId: string;
  let testSubjectId: string;
  let testTeacherId: string;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aceacademy.edu', password: 'Ace@12345' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.accessToken;

    // 2. Authenticate Teacher
    const teacherRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rajesh.sharma@aceacademy.edu', password: 'Ace@12345' });
    expect(teacherRes.status).toBe(200);
    teacherToken = teacherRes.body.accessToken;

    // 3. Authenticate Student
    const studentRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aarav.mehta@student.aceacademy.edu', password: 'Ace@12345' });
    expect(studentRes.status).toBe(200);
    studentToken = studentRes.body.accessToken;
    testStudentId = studentRes.body.user.studentProfile.id;

    // Get batch, course, subject, teacher IDs for tests
    const batch = await prisma.batch.findFirst();
    testBatchId = batch!.id;
    testCourseId = batch!.courseId;

    const subject = await prisma.subject.findFirst();
    testSubjectId = subject!.id;

    const teacher = await prisma.teacher.findFirst();
    testTeacherId = teacher!.id;
  });

  describe('1. Authentication & Role Permissions', () => {
    it('returns healthy status on /api/health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
    });

    it('denies student access to admin overview (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('denies unauthenticated requests (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/admin/overview');
      expect(res.status).toBe(401);
    });

    it('allows admin access to admin overview', async () => {
      const res = await request(app)
        .get('/api/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.counts.totalStudents).toBeGreaterThan(0);
      expect(res.body.counts.totalTeachers).toBeGreaterThan(0);
    });
  });

  describe('2. Student Management & Registration', () => {
    const testRoll = `TEST-ROLL-${Date.now().toString().slice(-4)}`;
    const testEmail = `test.student.${Date.now()}@student.aceacademy.edu`;

    it('admin can register a new student with batch enrollment and parent contact', async () => {
      const res = await request(app)
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Ishan Agrawal',
          email: testEmail,
          rollNumber: testRoll,
          gender: 'Male',
          bloodGroup: 'B+',
          batchId: testBatchId,
          parentName: 'Manoj Agrawal',
          parentPhone: '+91 99887 76655',
          whatsappNumber: '+919988776655',
          feeAmount: 95000,
        });

      expect(res.status).toBe(201);
      expect(res.body.student.rollNumber).toBe(testRoll);
    });

    it('newly registered student can log in', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'Ace@12345' });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('STUDENT');
      expect(res.body.accessToken).toBeDefined();
    });
  });

  describe('3. QR Code Attendance & Absentee Workflow', () => {
    it('scans QR code and records check-in', async () => {
      const res = await request(app)
        .post('/api/attendance/scan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ qrData: 'ACE-QR-AARAV-001', batchId: testBatchId });

      // Either 200 or 409 if already checked in earlier
      expect([200, 409]).toContain(res.status);
    });

    it('detects duplicate check-in on the same date', async () => {
      const res = await request(app)
        .post('/api/attendance/scan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ qrData: 'ACE-QR-AARAV-001', batchId: testBatchId });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(/already checked in today/i);
    });

    it('identifies absentees and pending verification in absentee workflow', async () => {
      const res = await request(app)
        .get('/api/attendance/absentee-alerts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.absentees).toBeInstanceOf(Array);
      expect(res.body.totalAbsentees).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Timetable Management & Conflict Validation', () => {
    it('fetches weekly timetable for a batch', async () => {
      const res = await request(app)
        .get(`/api/timetable/batch/${testBatchId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].subject).toBeDefined();
    });

    it('blocks teacher schedule conflicts (cannot double book)', async () => {
      // Mon 09:00 - 10:30 is already taught by testTeacherId
      const res = await request(app)
        .post('/api/timetable')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          batchId: testBatchId,
          subjectId: testSubjectId,
          teacherId: testTeacherId,
          dayOfWeek: 1, // Monday
          startTime: '09:15',
          endTime: '10:15',
          roomNumber: 'Hall C-303',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/conflict/i);
    });
  });

  describe('5. Marks Entry & Analytics', () => {
    let testExamId: string;

    it('creates an examination and allows marks entry with ranks auto-computed', async () => {
      const examRes = await request(app)
        .post('/api/marks/examinations')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: `Unit Test ${Date.now()}`,
          examType: 'UNIT_TEST',
          courseId: testCourseId,
          batchId: testBatchId,
          subjectId: testSubjectId,
          examDate: new Date().toISOString(),
          totalMarks: 50.0,
          passingMarks: 20.0,
        });

      expect(examRes.status).toBe(201);
      testExamId = examRes.body.id;

      // Submit marks
      const marksRes = await request(app)
        .post(`/api/marks/examinations/${testExamId}/results`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          results: [
            { studentId: testStudentId, marksObtained: 47.5, remarks: 'Excellent performance' },
          ],
        });

      expect(marksRes.status).toBe(200);
    });

    it('publishes results and verifies student can see their score', async () => {
      const pubRes = await request(app)
        .put(`/api/marks/examinations/${testExamId}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ isPublished: true });

      expect(pubRes.status).toBe(200);

      // Student views result
      const studentRes = await request(app)
        .get(`/api/marks/examinations/${testExamId}/results`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(studentRes.status).toBe(200);
      expect(studentRes.body.myResult.marksObtained).toBe(47.5);
    });

    it('returns student comprehensive performance analytics', async () => {
      const res = await request(app)
        .get(`/api/marks/student/${testStudentId}/analytics`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.subjectAnalytics).toBeInstanceOf(Array);
      expect(res.body.overallAverage).toBeGreaterThan(0);
    });
  });

  describe('6. Notes & Study Materials', () => {
    it('returns hierarchical notes tree: Course -> Subject -> Chapter -> Notes', async () => {
      const res = await request(app)
        .get('/api/notes/tree')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].subjects[0].chapters[0].notes.length).toBeGreaterThan(0);
    });
  });

  describe('7. WhatsApp Progress Reports', () => {
    it('previews formatted WhatsApp message with actual student metrics', async () => {
      const res = await request(app)
        .get(`/api/whatsapp/preview-report/${testStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.formattedMessage).toContain('ACE ACADEMY - MONTHLY PROGRESS REPORT');
      expect(res.body.attendancePercentage).toBeDefined();
      expect(res.body.subjectBreakdown).toBeInstanceOf(Array);
    });

    it('dispatches progress report and records in WhatsAppDeliveryLog', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send-monthly-report')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: testStudentId,
          month: 11,
          year: 2026,
        });

      expect(res.status).toBe(200);
      expect(res.body.deliveryLog.status).toBeDefined();
    });
  });
});

