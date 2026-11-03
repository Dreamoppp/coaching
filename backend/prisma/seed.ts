import { PrismaClient, Role, AttendanceStatus, AttendanceScanMethod, AbsenteeCallStatus, ExamType, FeeStatus, PaymentMode, ConversationType, NotificationType, WhatsAppStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

// Helper to create real dummy PDF note
function createDummyPdf(filePath: string, title: string, content: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.rect(0, 0, doc.page.width, 100).fill('#1e1b4b');
    doc.fontSize(22).fillColor('#ffffff').text('ACE ACADEMY', 50, 30);
    doc.fontSize(12).fillColor('#a78bfa').text('Premier Coaching Institute - Study Material', 50, 60);

    // Content
    doc.fontSize(18).fillColor('#1e1b4b').text(title, 50, 130);
    doc.fontSize(11).fillColor('#334155').text(content, 50, 165, {
      align: 'justify',
      lineGap: 4,
    });

    // Key concepts
    doc.moveDown(2);
    doc.fontSize(14).fillColor('#4f46e5').text('Core Formulae & Key Points:');
    doc.fontSize(10).fillColor('#475569');
    doc.text('1. Principle of Conservation of Momentum: Total momentum before = Total momentum after.');
    doc.text('2. Newton\'s Laws of Motion: F = ma; dP/dt = Net External Force.');
    doc.text('3. Work-Energy Theorem: Net Work Done = Change in Kinetic Energy.');
    doc.text('4. Rotational Dynamics: Torque = I * alpha; Angular Momentum L = I * omega.');

    doc.end();

    stream.on('finish', () => {
      const stats = fs.statSync(filePath);
      resolve(stats.size);
    });
    stream.on('error', reject);
  });
}

async function main() {
  console.log('🌱 Starting ACE Academy database seeding...');

  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 1. Institute Settings
  const institute = await prisma.instituteSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      instituteName: 'ACE Academy',
      tagLine: 'Excellence in JEE, NEET & Foundational Sciences',
      contactEmail: 'admissions@aceacademy.edu',
      contactPhone: '+91 98765 43210',
      address: 'ACE Towers, Knowledge Corridor, Shivaji Nagar, Pune 411005',
      lateArrivalCutoffMinutes: 30,
      whatsappProvider: 'MOCK',
    },
  });
  console.log('✅ Institute settings created:', institute.instituteName);

  // Hash password
  const defaultPassword = await bcrypt.hash('Ace@12345', 10);

  // 2. Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@aceacademy.edu' },
    update: {},
    create: {
      email: 'admin@aceacademy.edu',
      passwordHash: defaultPassword,
      name: 'Dr. Vikramaditya Rao',
      role: Role.ADMIN,
      phone: '+91 98765 00001',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // 3. Teachers
  const teacherData = [
    {
      name: 'Prof. Rajesh Sharma',
      email: 'rajesh.sharma@aceacademy.edu',
      phone: '+91 98765 10001',
      employeeId: 'EMP-PHY-01',
      qualification: 'M.Tech Physics (IIT Bombay)',
      experienceYears: 14,
      specialization: 'Mechanics & Modern Physics',
      bio: 'Senior faculty with 14+ years coaching JEE Advanced AIR top 100 rankers.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    {
      name: 'Dr. Meenakshi Verma',
      email: 'meenakshi.verma@aceacademy.edu',
      phone: '+91 98765 10002',
      employeeId: 'EMP-CHE-02',
      qualification: 'Ph.D. Chemistry (IISc Bangalore)',
      experienceYears: 10,
      specialization: 'Organic & Physical Chemistry',
      bio: 'Author of Organic Reaction Mechanisms guidebook for NEET & JEE.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    },
    {
      name: 'Prof. Amit Kulkarni',
      email: 'amit.kulkarni@aceacademy.edu',
      phone: '+91 98765 10003',
      employeeId: 'EMP-MAT-03',
      qualification: 'M.Sc. Applied Mathematics (CMI)',
      experienceYears: 12,
      specialization: 'Calculus, Algebra & Vectors',
      bio: 'Passionate mathematician simplifying complex coordinate geometry and calculus.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    },
    {
      name: 'Dr. Sunita Deshmukh',
      email: 'sunita.deshmukh@aceacademy.edu',
      phone: '+91 98765 10004',
      employeeId: 'EMP-BIO-04',
      qualification: 'M.B.B.S., MD (AIIMS New Delhi)',
      experienceYears: 9,
      specialization: 'Human Physiology & Genetics',
      bio: 'Medical expert training aspiring doctors to score 350+ in NEET Biology.',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    },
  ];

  const createdTeachers: any[] = [];
  for (const t of teacherData) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        passwordHash: defaultPassword,
        name: t.name,
        role: Role.TEACHER,
        phone: t.phone,
        avatar: t.avatar,
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        employeeId: t.employeeId,
        qualification: t.qualification,
        experienceYears: t.experienceYears,
        specialization: t.specialization,
        bio: t.bio,
      },
    });

    createdTeachers.push({ ...teacher, user });
  }
  console.log(`✅ Created ${createdTeachers.length} teachers`);

  // 4. Courses
  const course1 = await prisma.course.upsert({
    where: { code: 'JEE-ADV-2YR' },
    update: {},
    create: {
      code: 'JEE-ADV-2YR',
      name: 'IIT-JEE Pinnacle (2-Year Integrated)',
      description: 'Comprehensive program covering Physics, Chemistry, and Mathematics for JEE Main & Advanced.',
      durationMonths: 24,
      totalFees: 180000.0,
      isActive: true,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { code: 'NEET-MED-2YR' },
    update: {},
    create: {
      code: 'NEET-MED-2YR',
      name: 'NEET Apex Medical (2-Year Integrated)',
      description: 'Dedicated Medical Entrance coaching covering Physics, Chemistry, and Biology (Botany & Zoology).',
      durationMonths: 24,
      totalFees: 175000.0,
      isActive: true,
    },
  });
  console.log('✅ Created courses');

  // 5. Subjects
  const phy = await prisma.subject.upsert({
    where: { courseId_code: { courseId: course1.id, code: 'PHY-JEE' } },
    update: {},
    create: {
      courseId: course1.id,
      name: 'Physics',
      code: 'PHY-JEE',
      colorHex: '#6366f1', // Indigo
      description: 'Mechanics, Electrodynamics, Optics, Thermodynamics and Modern Physics',
    },
  });

  const che = await prisma.subject.upsert({
    where: { courseId_code: { courseId: course1.id, code: 'CHE-JEE' } },
    update: {},
    create: {
      courseId: course1.id,
      name: 'Chemistry',
      code: 'CHE-JEE',
      colorHex: '#10b981', // Emerald
      description: 'Physical, Inorganic, and Organic Chemistry with problem solving sessions',
    },
  });

  const mat = await prisma.subject.upsert({
    where: { courseId_code: { courseId: course1.id, code: 'MAT-JEE' } },
    update: {},
    create: {
      courseId: course1.id,
      name: 'Mathematics',
      code: 'MAT-JEE',
      colorHex: '#0ea5e9', // Sky Blue
      description: 'Calculus, Vectors, Coordinate Geometry, Complex Numbers and Algebra',
    },
  });

  const bio = await prisma.subject.upsert({
    where: { courseId_code: { courseId: course2.id, code: 'BIO-NEET' } },
    update: {},
    create: {
      courseId: course2.id,
      name: 'Biology',
      code: 'BIO-NEET',
      colorHex: '#f59e0b', // Amber
      description: 'Human Physiology, Genetics, Ecology, Plant Biology and Cell Structure',
    },
  });

  // Link teachers to subjects
  await prisma.subjectTeacher.upsert({
    where: { subjectId_teacherId: { subjectId: phy.id, teacherId: createdTeachers[0].id } },
    update: {},
    create: { subjectId: phy.id, teacherId: createdTeachers[0].id },
  });

  await prisma.subjectTeacher.upsert({
    where: { subjectId_teacherId: { subjectId: che.id, teacherId: createdTeachers[1].id } },
    update: {},
    create: { subjectId: che.id, teacherId: createdTeachers[1].id },
  });

  await prisma.subjectTeacher.upsert({
    where: { subjectId_teacherId: { subjectId: mat.id, teacherId: createdTeachers[2].id } },
    update: {},
    create: { subjectId: mat.id, teacherId: createdTeachers[2].id },
  });

  await prisma.subjectTeacher.upsert({
    where: { subjectId_teacherId: { subjectId: bio.id, teacherId: createdTeachers[3].id } },
    update: {},
    create: { subjectId: bio.id, teacherId: createdTeachers[3].id },
  });
  console.log('✅ Created subjects and linked teachers');

  // 6. Chapters & Notes
  const ch1Phy = await prisma.chapter.upsert({
    where: { subjectId_chapterNumber: { subjectId: phy.id, chapterNumber: 1 } },
    update: {},
    create: {
      subjectId: phy.id,
      chapterNumber: 1,
      title: 'Kinematics & Newton Laws of Motion',
      description: 'Vectors, 1D & 2D motion, friction, and Newton laws with free-body diagrams.',
    },
  });

  const ch2Phy = await prisma.chapter.upsert({
    where: { subjectId_chapterNumber: { subjectId: phy.id, chapterNumber: 2 } },
    update: {},
    create: {
      subjectId: phy.id,
      chapterNumber: 2,
      title: 'Rotational Motion & Gravitation',
      description: 'Moment of inertia, torque, angular momentum, and planetary motion.',
    },
  });

  const ch1Che = await prisma.chapter.upsert({
    where: { subjectId_chapterNumber: { subjectId: che.id, chapterNumber: 1 } },
    update: {},
    create: {
      subjectId: che.id,
      chapterNumber: 1,
      title: 'Chemical Bonding & Molecular Structure',
      description: 'VSEPR theory, hybridization, dipole moments, and molecular orbital theory.',
    },
  });

  const ch1Mat = await prisma.chapter.upsert({
    where: { subjectId_chapterNumber: { subjectId: mat.id, chapterNumber: 1 } },
    update: {},
    create: {
      subjectId: mat.id,
      chapterNumber: 1,
      title: 'Differential Calculus & Applications',
      description: 'Continuity, differentiability, maxima/minima, tangents and normals.',
    },
  });

  // Create real PDF files on disk and create Note records
  const pdfPath1 = path.join(uploadsDir, 'Physics_Ch1_Mechanics_Summary.pdf');
  const size1 = await createDummyPdf(
    pdfPath1,
    'Chapter 1: Kinematics & Mechanics Comprehensive Notes',
    'This module covers standard projectile motion equations, friction coefficients, static vs kinetic regimes, and impulse-momentum relations with worked out sample problems.'
  );

  const pdfPath2 = path.join(uploadsDir, 'Chemistry_Ch1_Bonding_Guide.pdf');
  const size2 = await createDummyPdf(
    pdfPath2,
    'Chapter 1: Chemical Bonding Master Notes',
    'Covers sigma and pi bonds, sp/sp2/sp3/sp3d hybrid orbitals, resonance stabilization energies, and hydrogen bonding anomalies.'
  );

  await prisma.note.createMany({
    data: [
      {
        chapterId: ch1Phy.id,
        title: 'Kinematics & NLM Formula Sheet & Derivations',
        description: 'Complete high-yield formula reference and solved example sheets for JEE Advanced.',
        fileUrl: '/uploads/Physics_Ch1_Mechanics_Summary.pdf',
        fileName: 'Physics_Ch1_Mechanics_Summary.pdf',
        fileSize: size1,
        uploadedById: createdTeachers[0].userId,
        version: 1,
      },
      {
        chapterId: ch1Che.id,
        title: 'Chemical Bonding Conceptual Handout',
        description: 'Detailed explanation of VSEPR geometries and MO energy diagrams.',
        fileUrl: '/uploads/Chemistry_Ch1_Bonding_Guide.pdf',
        fileName: 'Chemistry_Ch1_Bonding_Guide.pdf',
        fileSize: size2,
        uploadedById: createdTeachers[1].userId,
        version: 1,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created chapters and uploaded notes');

  // 7. Batches
  const batchPhoenix = await prisma.batch.upsert({
    where: { batchCode: 'PHOENIX-JEE-26' },
    update: {},
    create: {
      courseId: course1.id,
      name: 'Batch Phoenix (JEE Advanced 2026)',
      batchCode: 'PHOENIX-JEE-26',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2028-05-31'),
      maxCapacity: 35,
      defaultRoom: 'Hall A-101',
      classStartTime: '09:00',
      isActive: true,
    },
  });

  const batchApex = await prisma.batch.upsert({
    where: { batchCode: 'APEX-NEET-26' },
    update: {},
    create: {
      courseId: course2.id,
      name: 'Batch Apex (NEET Medical 2026)',
      batchCode: 'APEX-NEET-26',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2028-05-31'),
      maxCapacity: 40,
      defaultRoom: 'Hall B-204',
      classStartTime: '09:00',
      isActive: true,
    },
  });
  console.log('✅ Created batches');

  // 8. Students & Parents
  const studentData = [
    {
      name: 'Aarav Mehta',
      email: 'aarav.mehta@student.aceacademy.edu',
      phone: '+91 91234 56701',
      rollNumber: 'ACE-2026-001',
      qrCode: 'ACE-QR-AARAV-001',
      gender: 'Male',
      bloodGroup: 'O+',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80',
      parent: {
        fatherName: 'Sanjay Mehta',
        fatherPhone: '+91 98220 11001',
        motherName: 'Sunita Mehta',
        whatsappNumber: '+919822011001',
        email: 'sanjay.mehta@gmail.com',
      },
    },
    {
      name: 'Diya Sengupta',
      email: 'diya.sengupta@student.aceacademy.edu',
      phone: '+91 91234 56702',
      rollNumber: 'ACE-2026-002',
      qrCode: 'ACE-QR-DIYA-002',
      gender: 'Female',
      bloodGroup: 'B+',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      parent: {
        fatherName: 'Subir Sengupta',
        fatherPhone: '+91 98220 11002',
        motherName: 'Mousumi Sengupta',
        whatsappNumber: '+919822011002',
        email: 'subir.sen@gmail.com',
      },
    },
    {
      name: 'Rohan Iyer',
      email: 'rohan.iyer@student.aceacademy.edu',
      phone: '+91 91234 56703',
      rollNumber: 'ACE-2026-003',
      qrCode: 'ACE-QR-ROHAN-003',
      gender: 'Male',
      bloodGroup: 'A+',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
      parent: {
        fatherName: 'Ramanathan Iyer',
        fatherPhone: '+91 98220 11003',
        motherName: 'Gayatri Iyer',
        whatsappNumber: '+919822011003',
        email: 'iyer.raman@gmail.com',
      },
    },
    {
      name: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@student.aceacademy.edu',
      phone: '+91 91234 56704',
      rollNumber: 'ACE-2026-004',
      qrCode: 'ACE-QR-ANANYA-004',
      gender: 'Female',
      bloodGroup: 'AB+',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80',
      parent: {
        fatherName: 'Prakash Deshmukh',
        fatherPhone: '+91 98220 11004',
        motherName: 'Seema Deshmukh',
        whatsappNumber: '+919822011004',
        email: 'prakash.deshmukh@yahoo.com',
      },
    },
    {
      name: 'Kabir Kapoor',
      email: 'kabir.kapoor@student.aceacademy.edu',
      phone: '+91 91234 56705',
      rollNumber: 'ACE-2026-005',
      qrCode: 'ACE-QR-KABIR-005',
      gender: 'Male',
      bloodGroup: 'O-',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
      parent: {
        fatherName: 'Vikram Kapoor',
        fatherPhone: '+91 98220 11005',
        motherName: 'Rhea Kapoor',
        whatsappNumber: '+919822011005',
        email: 'vkapoor@gmail.com',
      },
    },
  ];

  const createdStudents: any[] = [];
  for (const s of studentData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: defaultPassword,
        name: s.name,
        role: Role.STUDENT,
        phone: s.phone,
        avatar: s.avatar,
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        rollNumber: s.rollNumber,
        qrCode: s.qrCode,
        gender: s.gender,
        bloodGroup: s.bloodGroup,
        dateOfBirth: new Date('2008-05-15'),
        address: 'Shivaji Nagar, Pune',
        emergencyContact: s.parent.fatherPhone,
      },
    });

    await prisma.parentsContact.upsert({
      where: { studentId: student.id },
      update: {},
      create: {
        studentId: student.id,
        fatherName: s.parent.fatherName,
        fatherPhone: s.parent.fatherPhone,
        motherName: s.parent.motherName,
        whatsappNumber: s.parent.whatsappNumber,
        email: s.parent.email,
      },
    });

    // Enroll in Batch Phoenix
    await prisma.enrollment.upsert({
      where: { studentId_batchId: { studentId: student.id, batchId: batchPhoenix.id } },
      update: {},
      create: {
        studentId: student.id,
        batchId: batchPhoenix.id,
        status: 'ACTIVE',
      },
    });

    // Fee record
    await prisma.feeRecord.upsert({
      where: { invoiceNumber: `INV-2026-${s.rollNumber}` },
      update: {},
      create: {
        invoiceNumber: `INV-2026-${s.rollNumber}`,
        studentId: student.id,
        batchId: batchPhoenix.id,
        amount: 90000.0,
        paidAmount: s.rollNumber === 'ACE-2026-004' ? 45000.0 : 90000.0,
        dueDate: new Date('2026-07-15'),
        paidDate: new Date('2026-06-10'),
        paymentMode: PaymentMode.UPI,
        status: s.rollNumber === 'ACE-2026-004' ? FeeStatus.PARTIAL : FeeStatus.PAID,
        remarks: 'Term 1 Tuition & Material Fee',
      },
    });

    createdStudents.push({ ...student, user, parent: s.parent });
  }
  console.log(`✅ Created ${createdStudents.length} students with parent contacts and fee records`);

  // 9. Timetable Sessions (Mon - Sat)
  const timetableEntries = [
    // Monday
    { batchId: batchPhoenix.id, subjectId: phy.id, teacherId: createdTeachers[0].id, dayOfWeek: 1, startTime: '09:00', endTime: '10:30', roomNumber: 'Hall A-101' },
    { batchId: batchPhoenix.id, subjectId: che.id, teacherId: createdTeachers[1].id, dayOfWeek: 1, startTime: '10:45', endTime: '12:15', roomNumber: 'Hall A-101' },
    { batchId: batchPhoenix.id, subjectId: mat.id, teacherId: createdTeachers[2].id, dayOfWeek: 1, startTime: '12:45', endTime: '14:15', roomNumber: 'Hall A-101' },

    // Tuesday
    { batchId: batchPhoenix.id, subjectId: mat.id, teacherId: createdTeachers[2].id, dayOfWeek: 2, startTime: '09:00', endTime: '10:30', roomNumber: 'Hall A-101' },
    { batchId: batchPhoenix.id, subjectId: phy.id, teacherId: createdTeachers[0].id, dayOfWeek: 2, startTime: '10:45', endTime: '12:15', roomNumber: 'Hall A-101' },
    { batchId: batchPhoenix.id, subjectId: che.id, teacherId: createdTeachers[1].id, dayOfWeek: 2, startTime: '12:45', endTime: '14:15', roomNumber: 'Hall A-101' },

    // Wednesday
    { batchId: batchPhoenix.id, subjectId: phy.id, teacherId: createdTeachers[0].id, dayOfWeek: 3, startTime: '09:00', endTime: '10:30', roomNumber: 'Hall A-101' },
    { batchId: batchPhoenix.id, subjectId: che.id, teacherId: createdTeachers[1].id, dayOfWeek: 3, startTime: '10:45', endTime: '12:15', roomNumber: 'Hall A-101' },
    { batchId: batchPhoenix.id, subjectId: mat.id, teacherId: createdTeachers[2].id, dayOfWeek: 3, startTime: '12:45', endTime: '14:15', roomNumber: 'Hall A-101' },

    // Thursday
    { batchId: batchPhoenix.id, subjectId: mat.id, teacherId: createdTeachers[2].id, dayOfWeek: 4, startTime: '09:00', endTime: '10:30', roomNumber: 'Hall A-101' },
    { batchId: batchPhoenix.id, subjectId: phy.id, teacherId: createdTeachers[0].id, dayOfWeek: 4, startTime: '10:45', endTime: '12:15', roomNumber: 'Hall A-101' },
    { batchId: batchPhoenix.id, subjectId: che.id, teacherId: createdTeachers[1].id, dayOfWeek: 4, startTime: '12:45', endTime: '14:15', roomNumber: 'Hall A-101' },

    // Friday
    { batchId: batchPhoenix.id, subjectId: phy.id, teacherId: createdTeachers[0].id, dayOfWeek: 5, startTime: '09:00', endTime: '10:30', roomNumber: 'Hall A-101' },
    { batchId: batchPhoenix.id, subjectId: mat.id, teacherId: createdTeachers[2].id, dayOfWeek: 5, startTime: '10:45', endTime: '12:15', roomNumber: 'Hall A-101' },
    { batchId: batchPhoenix.id, subjectId: che.id, teacherId: createdTeachers[1].id, dayOfWeek: 5, startTime: '12:45', endTime: '14:15', roomNumber: 'Hall A-101' },

    // Saturday (Doubt Clearing & Mock Drill)
    { batchId: batchPhoenix.id, subjectId: phy.id, teacherId: createdTeachers[0].id, dayOfWeek: 6, startTime: '09:00', endTime: '11:00', roomNumber: 'Hall A-101' },
    { batchId: batchPhoenix.id, subjectId: mat.id, teacherId: createdTeachers[2].id, dayOfWeek: 6, startTime: '11:15', endTime: '13:15', roomNumber: 'Hall A-101' },
  ];

  await prisma.timetableSession.deleteMany({ where: { batchId: batchPhoenix.id } });
  for (const entry of timetableEntries) {
    await prisma.timetableSession.create({ data: entry });
  }
  console.log(`✅ Created ${timetableEntries.length} timetable sessions`);

  // 10. Attendance Records (Past 10 days + Today with absentee workflow demo)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Today's attendance
  // Aarav: Present (08:52 AM)
  const tAarav = new Date(today);
  tAarav.setHours(8, 52, 0);
  await prisma.attendanceRecord.upsert({
    where: { studentId_batchId_date: { studentId: createdStudents[0].id, batchId: batchPhoenix.id, date: today } },
    update: {},
    create: {
      studentId: createdStudents[0].id,
      batchId: batchPhoenix.id,
      date: today,
      status: AttendanceStatus.PRESENT,
      checkInTime: tAarav,
      scanMethod: AttendanceScanMethod.QR,
      verifiedBy: 'System QR Gate',
    },
  });

  // Diya: Present (08:56 AM)
  const tDiya = new Date(today);
  tDiya.setHours(8, 56, 0);
  await prisma.attendanceRecord.upsert({
    where: { studentId_batchId_date: { studentId: createdStudents[1].id, batchId: batchPhoenix.id, date: today } },
    update: {},
    create: {
      studentId: createdStudents[1].id,
      batchId: batchPhoenix.id,
      date: today,
      status: AttendanceStatus.PRESENT,
      checkInTime: tDiya,
      scanMethod: AttendanceScanMethod.QR,
      verifiedBy: 'System QR Gate',
    },
  });

  // Rohan: Late (09:35 AM)
  const tRohan = new Date(today);
  tRohan.setHours(9, 35, 0);
  await prisma.attendanceRecord.upsert({
    where: { studentId_batchId_date: { studentId: createdStudents[2].id, batchId: batchPhoenix.id, date: today } },
    update: {},
    create: {
      studentId: createdStudents[2].id,
      batchId: batchPhoenix.id,
      date: today,
      status: AttendanceStatus.LATE,
      checkInTime: tRohan,
      scanMethod: AttendanceScanMethod.QR,
      verifiedBy: 'Receptionist Barcode Desk',
      absenteeRemarks: 'Metro delay at Deccan Gymkhana',
    },
  });

  // Ananya: Absent - Triggers 30-min absentee alert!
  await prisma.attendanceRecord.upsert({
    where: { studentId_batchId_date: { studentId: createdStudents[3].id, batchId: batchPhoenix.id, date: today } },
    update: {},
    create: {
      studentId: createdStudents[3].id,
      batchId: batchPhoenix.id,
      date: today,
      status: AttendanceStatus.ABSENT,
      scanMethod: AttendanceScanMethod.MANUAL,
      absenteeCallStatus: AbsenteeCallStatus.PENDING,
      absenteeRemarks: 'No check-in 30 mins after scheduled 09:00 AM start. Parent verification call pending.',
    },
  });

  // Kabir: Present (08:58 AM)
  const tKabir = new Date(today);
  tKabir.setHours(8, 58, 0);
  await prisma.attendanceRecord.upsert({
    where: { studentId_batchId_date: { studentId: createdStudents[4].id, batchId: batchPhoenix.id, date: today } },
    update: {},
    create: {
      studentId: createdStudents[4].id,
      batchId: batchPhoenix.id,
      date: today,
      status: AttendanceStatus.PRESENT,
      checkInTime: tKabir,
      scanMethod: AttendanceScanMethod.QR,
      verifiedBy: 'System QR Gate',
    },
  });

  // Historical attendance for past 14 days
  for (let i = 1; i <= 14; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - i);
    // Skip Sunday
    if (pastDate.getDay() === 0) continue;

    for (let sIndex = 0; sIndex < createdStudents.length; sIndex++) {
      const student = createdStudents[sIndex];
      // Random deterministic pattern
      const isAbsent = (i + sIndex) % 7 === 0;
      const isLate = (i * 2 + sIndex) % 9 === 0;
      const status = isAbsent ? AttendanceStatus.ABSENT : isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

      const checkIn = new Date(pastDate);
      checkIn.setHours(status === AttendanceStatus.LATE ? 9 : 8, status === AttendanceStatus.LATE ? 40 : 50 + (sIndex * 2));

      await prisma.attendanceRecord.upsert({
        where: { studentId_batchId_date: { studentId: student.id, batchId: batchPhoenix.id, date: pastDate } },
        update: {},
        create: {
          studentId: student.id,
          batchId: batchPhoenix.id,
          date: pastDate,
          status,
          checkInTime: status !== AttendanceStatus.ABSENT ? checkIn : null,
          scanMethod: AttendanceScanMethod.QR,
        },
      });
    }
  }
  console.log('✅ Created historical and current attendance records');

  // 11. Examinations & Results
  const exam1 = await prisma.examination.create({
    data: {
      title: 'Monthly Cumulative Test - Physics Mechanics',
      examType: ExamType.UNIT_TEST,
      courseId: course1.id,
      batchId: batchPhoenix.id,
      subjectId: phy.id,
      examDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      totalMarks: 100.0,
      passingMarks: 40.0,
      isPublished: true,
    },
  });

  const exam2 = await prisma.examination.create({
    data: {
      title: 'Grand Diagnostic Test - Mathematics Calculus',
      examType: ExamType.MID_TERM,
      courseId: course1.id,
      batchId: batchPhoenix.id,
      subjectId: mat.id,
      examDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      totalMarks: 100.0,
      passingMarks: 40.0,
      isPublished: true,
    },
  });

  const exam3 = await prisma.examination.create({
    data: {
      title: 'Upcoming Assessment - Chemical Bonding & Equilibrium',
      examType: ExamType.UNIT_TEST,
      courseId: course1.id,
      batchId: batchPhoenix.id,
      subjectId: che.id,
      examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // in 5 days
      totalMarks: 100.0,
      passingMarks: 40.0,
      isPublished: false,
    },
  });

  // Results for Exam 1 (Mechanics)
  const exam1Scores = [
    { student: createdStudents[0], marks: 94.0, rank: 1, percentile: 99.2, remarks: 'Outstanding problem solving speed.' },
    { student: createdStudents[1], marks: 88.5, rank: 2, percentile: 94.5, remarks: 'Excellent precision on numericals.' },
    { student: createdStudents[4], marks: 82.0, rank: 3, percentile: 88.0, remarks: 'Strong fundamentals; improve vector diagrams.' },
    { student: createdStudents[2], marks: 74.0, rank: 4, percentile: 76.5, remarks: 'Good attempt, review rotational dynamics.' },
    { student: createdStudents[3], marks: 66.5, rank: 5, percentile: 65.0, remarks: 'Needs more practice with friction questions.' },
  ];

  for (const res of exam1Scores) {
    await prisma.examResult.create({
      data: {
        examinationId: exam1.id,
        studentId: res.student.id,
        marksObtained: res.marks,
        rank: res.rank,
        percentile: res.percentile,
        remarks: res.remarks,
      },
    });
  }

  // Results for Exam 2 (Calculus)
  const exam2Scores = [
    { student: createdStudents[1], marks: 96.0, rank: 1, percentile: 99.5, remarks: 'Flawless calculus integration proofs.' },
    { student: createdStudents[0], marks: 91.0, rank: 2, percentile: 95.0, remarks: 'High accuracy in limits and derivatives.' },
    { student: createdStudents[2], marks: 80.0, rank: 3, percentile: 85.0, remarks: 'Good; solve more trigonometric substitution.' },
    { student: createdStudents[4], marks: 77.5, rank: 4, percentile: 80.0, remarks: 'Consistent score, keep up the momentum.' },
    { student: createdStudents[3], marks: 71.0, rank: 5, percentile: 72.0, remarks: 'Focus on definite integration properties.' },
  ];

  for (const res of exam2Scores) {
    await prisma.examResult.create({
      data: {
        examinationId: exam2.id,
        studentId: res.student.id,
        marksObtained: res.marks,
        rank: res.rank,
        percentile: res.percentile,
        remarks: res.remarks,
      },
    });
  }
  console.log('✅ Created examinations and student results');

  // 12. Batch Discussion Group & Messages
  const batchConversation = await prisma.conversation.create({
    data: {
      type: ConversationType.BATCH_GROUP,
      title: 'Batch Phoenix (JEE 2026) Official Forum',
      batchId: batchPhoenix.id,
      participants: {
        create: [
          { userId: adminUser.id },
          { userId: createdTeachers[0].userId },
          { userId: createdTeachers[1].userId },
          { userId: createdTeachers[2].userId },
          { userId: createdStudents[0].userId },
          { userId: createdStudents[1].userId },
          { userId: createdStudents[2].userId },
          { userId: createdStudents[3].userId },
          { userId: createdStudents[4].userId },
        ],
      },
    },
  });

  // Direct conversation between Teacher Prof. Rajesh and Student Aarav
  const directConversation = await prisma.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      title: 'Prof. Rajesh Sharma & Aarav Mehta',
      participants: {
        create: [
          { userId: createdTeachers[0].userId },
          { userId: createdStudents[0].userId },
        ],
      },
    },
  });

  // Sample messages in batch group
  await prisma.message.createMany({
    data: [
      {
        conversationId: batchConversation.id,
        senderId: createdTeachers[0].userId,
        content: 'Welcome to Week 6! Please review Chapter 1 formula sheet before tomorrow\'s rotational dynamics lecture.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        conversationId: batchConversation.id,
        senderId: createdStudents[0].userId,
        content: 'Thank you Sir! Will question 14 from Irodov be discussed in class tomorrow?',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000),
      },
      {
        conversationId: batchConversation.id,
        senderId: createdTeachers[0].userId,
        content: 'Yes Aarav, we will solve Q14 and Q18 on angular momentum conservation at 10:00 AM.',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 7200000),
      },
      {
        conversationId: batchConversation.id,
        senderId: createdStudents[1].userId,
        content: 'Sir, I have uploaded my doubts for question 22 in the assignment portal.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Direct message
  await prisma.message.createMany({
    data: [
      {
        conversationId: directConversation.id,
        senderId: createdStudents[0].userId,
        content: 'Sir, could you please give me some feedback on my physics mechanics test paper?',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        conversationId: directConversation.id,
        senderId: createdTeachers[0].userId,
        content: 'Great score of 94/100, Aarav! Your free body diagrams were spot-on. Just be careful with numerical unit conversions on Q7.',
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      },
    ],
  });
  console.log('✅ Created real-time conversations and messages');

  // 13. Announcements & Notifications
  await prisma.notification.createMany({
    data: [
      {
        title: 'Parent-Teacher Interaction Schedule',
        message: 'The monthly PTM for Batch Phoenix will be held this Saturday between 2 PM to 5 PM.',
        type: NotificationType.ANNOUNCEMENT,
        batchId: batchPhoenix.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'JEE Advanced Mock Series Announcement',
        message: 'Special 3-hour computer based mock test series begins from 15th of this month.',
        type: NotificationType.EXAM,
        batchId: batchPhoenix.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        userId: createdStudents[0].userId,
        title: 'Test Result Published',
        message: 'Your result for Monthly Cumulative Test - Physics Mechanics is published. Marks: 94/100 (Rank 1).',
        type: NotificationType.MARKS,
        isRead: false,
      },
    ],
  });

  // 14. Monthly Progress Report & WhatsApp Log
  const report1 = await prisma.progressReport.upsert({
    where: { studentId_month_year: { studentId: createdStudents[0].id, month: 10, year: 2026 } },
    update: {},
    create: {
      studentId: createdStudents[0].id,
      month: 10,
      year: 2026,
      totalClasses: 26,
      attendedClasses: 25,
      attendancePercentage: 96.15,
      averageMarksPercentage: 92.5,
      remarks: 'Consistently among top performers in all competitive assessments. Demonstrates superior conceptual clarity.',
      areasOfImprovement: 'Speed in multi-step organic chemistry synthesis problems.',
      isSentToParent: true,
      sentAt: new Date(),
    },
  });

  await prisma.whatsAppDeliveryLog.create({
    data: {
      studentId: createdStudents[0].id,
      parentPhone: createdStudents[0].parent.whatsappNumber,
      messageType: 'PROGRESS_REPORT',
      status: WhatsAppStatus.DELIVERED,
      provider: 'MOCK',
      externalMessageId: 'WA-MSG-' + Math.random().toString(36).substring(7).toUpperCase(),
      payloadJson: JSON.stringify({
        studentName: createdStudents[0].user.name,
        month: 'October 2026',
        attendance: '96.15%',
        averageMarks: '92.5%',
        rank: 'Batch Rank 1',
        remarks: 'Consistently among top performers.',
      }),
    },
  });

  // 15. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      entityType: 'ACADEMY',
      details: 'System configured with full JEE and NEET batches, attendance rules, and timetable schedules.',
    },
  });

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

