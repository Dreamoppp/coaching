import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';

// Admin Pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminTeachers } from './pages/admin/AdminTeachers';
import { AdminBatches } from './pages/admin/AdminBatches';
import { AdminTimetable } from './pages/admin/AdminTimetable';
import { AdminAttendance } from './pages/admin/AdminAttendance';
import { AdminMarks } from './pages/admin/AdminMarks';
import { AdminNotes } from './pages/admin/AdminNotes';
import { AdminFees } from './pages/admin/AdminFees';
import { AdminWhatsApp } from './pages/admin/AdminWhatsApp';
import { AdminSettings } from './pages/admin/AdminSettings';

// Teacher Pages
import { TeacherOverview } from './pages/teacher/TeacherOverview';
import { TeacherAttendance } from './pages/teacher/TeacherAttendance';
import { TeacherMarks } from './pages/teacher/TeacherMarks';
import { TeacherNotes } from './pages/teacher/TeacherNotes';
import { TeacherTimetable } from './pages/teacher/TeacherTimetable';
import { TeacherMessages } from './pages/teacher/TeacherMessages';

// Student Pages
import { StudentOverview } from './pages/student/StudentOverview';
import { StudentIDCard } from './pages/student/StudentIDCard';
import { StudentTimetable } from './pages/student/StudentTimetable';
import { StudentMarks } from './pages/student/StudentMarks';
import { StudentNotes } from './pages/student/StudentNotes';
import { StudentMessages } from './pages/student/StudentMessages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Admin Portal Routes */}
              <Route path="/admin" element={<DashboardLayout allowedRoles={['ADMIN']} />}>
                <Route index element={<AdminOverview />} />
                <Route path="students" element={<AdminStudents />} />
                <Route path="teachers" element={<AdminTeachers />} />
                <Route path="batches" element={<AdminBatches />} />
                <Route path="timetable" element={<AdminTimetable />} />
                <Route path="attendance" element={<AdminAttendance />} />
                <Route path="marks" element={<AdminMarks />} />
                <Route path="notes" element={<AdminNotes />} />
                <Route path="fees" element={<AdminFees />} />
                <Route path="whatsapp" element={<AdminWhatsApp />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              {/* Teacher Portal Routes */}
              <Route path="/teacher" element={<DashboardLayout allowedRoles={['TEACHER', 'ADMIN']} />}>
                <Route index element={<TeacherOverview />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="marks" element={<TeacherMarks />} />
                <Route path="notes" element={<TeacherNotes />} />
                <Route path="timetable" element={<TeacherTimetable />} />
                <Route path="messages" element={<TeacherMessages />} />
              </Route>

              {/* Student Portal Routes */}
              <Route path="/student" element={<DashboardLayout allowedRoles={['STUDENT', 'ADMIN']} />}>
                <Route index element={<StudentOverview />} />
                <Route path="id-card" element={<StudentIDCard />} />
                <Route path="timetable" element={<StudentTimetable />} />
                <Route path="marks" element={<StudentMarks />} />
                <Route path="notes" element={<StudentNotes />} />
                <Route path="messages" element={<StudentMessages />} />
              </Route>

              {/* Catch-all Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

