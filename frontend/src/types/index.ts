export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'STAFF';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  teacherProfile?: Teacher;
  studentProfile?: Student;
}

export interface ParentContact {
  id: string;
  fatherName?: string;
  fatherPhone?: string;
  motherName?: string;
  motherPhone?: string;
  whatsappNumber: string;
  email?: string;
}

export interface Student {
  id: string;
  userId: string;
  rollNumber: string;
  qrCode: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  user: User;
  parentContact?: ParentContact;
  enrollments?: Enrollment[];
}

export interface Teacher {
  id: string;
  userId: string;
  employeeId: string;
  qualification?: string;
  experienceYears?: number;
  specialization?: string;
  bio?: string;
  user: User;
  subjects?: { subject: Subject }[];
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  durationMonths: number;
  totalFees: number;
  isActive: boolean;
  subjects?: Subject[];
  batches?: Batch[];
}

export interface Subject {
  id: string;
  courseId: string;
  name: string;
  code: string;
  colorHex: string;
  description?: string;
  course?: Course;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  subjectId: string;
  chapterNumber: number;
  title: string;
  description?: string;
  notes?: Note[];
}

export interface Note {
  id: string;
  chapterId: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedById: string;
  version: number;
  createdAt: string;
}

export interface Batch {
  id: string;
  courseId: string;
  name: string;
  batchCode: string;
  startDate: string;
  endDate?: string;
  maxCapacity: number;
  defaultRoom?: string;
  classStartTime: string;
  isActive: boolean;
  course?: Course;
  _count?: { enrollments: number };
}

export interface Enrollment {
  id: string;
  studentId: string;
  batchId: string;
  enrolledAt: string;
  status: string;
  batch?: Batch;
}

export interface TimetableSession {
  id: string;
  batchId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number; // 1 = Monday ... 7 = Sunday
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  roomNumber: string;
  isActive: boolean;
  batch?: Batch;
  subject?: Subject;
  teacher?: Teacher;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'AWAITING_VERIFICATION' | 'EXCUSED';
export type AbsenteeCallStatus = 'PENDING' | 'CALLED_CONFIRMED' | 'NO_ANSWER' | 'NOT_REACHABLE' | 'NOT_REQUIRED';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  batchId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  scanMethod: 'QR' | 'MANUAL' | 'BIOMETRIC';
  verifiedBy?: string;
  absenteeCallStatus: AbsenteeCallStatus;
  absenteeRemarks?: string;
  student?: Student;
  batch?: Batch;
}

export interface Examination {
  id: string;
  title: string;
  examType: 'WEEKLY_TEST' | 'UNIT_TEST' | 'MID_TERM' | 'FINAL_EXAM' | 'MOCK_TEST';
  courseId: string;
  batchId: string;
  subjectId: string;
  examDate: string;
  totalMarks: number;
  passingMarks: number;
  isPublished: boolean;
  batch?: Batch;
  subject?: Subject;
  results?: ExamResult[];
  _count?: { results: number };
}

export interface ExamResult {
  id: string;
  examinationId: string;
  studentId: string;
  marksObtained: number;
  rank?: number;
  percentile?: number;
  remarks?: string;
  student?: Student;
  examination?: Examination;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: Role;
    avatar?: string;
  };
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'BATCH_GROUP';
  title?: string;
  avatar?: string;
  batch?: { id: string; name: string; batchCode: string };
  lastMessage?: Message;
  updatedAt: string;
  participants?: { user: User }[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'ANNOUNCEMENT' | 'ATTENDANCE' | 'EXAM' | 'MARKS' | 'FEE' | 'GENERAL';
  isRead: boolean;
  createdAt: string;
  batchId?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  batchId: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidDate?: string;
  paymentMode: 'CASH' | 'ONLINE' | 'UPI' | 'CHEQUE' | 'BANK_TRANSFER';
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  invoiceNumber: string;
  remarks?: string;
  student?: Student;
  batch?: Batch;
}

export interface WhatsAppLog {
  id: string;
  studentId?: string;
  parentPhone: string;
  messageType: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  provider: string;
  externalMessageId?: string;
  payloadJson?: string;
  sentAt: string;
  student?: Student;
}

export interface InstituteSettings {
  id: string;
  instituteName: string;
  tagLine: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  logoUrl?: string;
  lateArrivalCutoffMinutes: number;
  whatsappProvider: string;
  whatsappApiKey?: string;
}

