# ACE Academy — Coaching Institute Management Platform

A modern, production-oriented, fully functional SaaS coaching management web platform inspired by premier coaching institutes (JEE / NEET / Foundations).

Built with **React, Vite, TypeScript, Tailwind CSS, Node.js, Express, Socket.IO, PostgreSQL, and Prisma ORM**.

---

## 🌟 Architecture & Key Features

### 1. Three Authenticated Portals
- **Admin Dashboard (`/admin`)**:
  - Central metrics: total students, faculty, batches, courses, fees collected vs pending.
  - Student registration with automatic roll numbers, parent contact info, batch enrollment, and verifiable QR code generation.
  - Faculty management with assigned subject disciplines and credentials.
  - Batch creation with scheduled arrival times and room assignments.
  - Tuition fee records with payment receipt logging (UPI, NetBanking, Cash, Cheque).
  - WhatsApp monthly progress report dispatcher with live preview simulator.
  - Institute settings and security audit logging.

- **Teacher Dashboard (`/teacher`)**:
  - Daily lecture schedule and batch rosters.
  - Batch attendance register with QR scanner integration & manual status overrides.
  - Examination marks entry with auto-computed percentiles, class rankings, and publish toggle.
  - Chapter-wise PDF notes management (upload, versioning, preview & download).
  - Real-time discussion forum and 1-on-1 student mentorship chat.

- **Student Dashboard (`/student`)**:
  - Digital Student ID Card with personalized QR Gate Pass (scannable at reception).
  - Animated circular progress chart for overall lecture attendance ratio.
  - Weekly visual lecture timetable grid.
  - Academic scorecards with merit ranks, percentiles, and subject strength bars.
  - Chapter study material download center with embedded PDF viewer.
  - Live faculty doubt clearing channel.

---

### 2. Specialized Capabilities
- **QR Code Gate Attendance & 30-Minute Absentee Cutoff Alert Board**:
  - Mobile/desktop browser scanner verifies student identity and batch enrollment.
  - Automatically flags absentees **30 minutes after batch start time** for staff telephone verification.
  - Displays student name, batch, scheduled arrival time, parent phone number, and call status log (Called Confirmed, No Answer, etc.).
- **Visual Timetable Matrix with Conflict Validation**:
  - Monday through Sunday visual schedule grid.
  - Real-time algorithmic check prevents teacher double-booking, room overlap, and batch timing clashes.
- **WhatsApp Progress Reports**:
  - Monthly report generation directly from student database records (attendance %, test marks, teacher remarks, areas for improvement).
  - Formatted WhatsApp message preview and delivery logging with external message IDs.
  - Configurable for development preview or live providers (Meta Cloud API / Twilio).
- **Study Material Organization**:
  - Strict hierarchical categorization: Program → Subject → Chapter → PDF files.
- **Real-Time Messaging**:
  - Powered by Socket.IO over authenticated WebSocket rooms, persisted in PostgreSQL.

---

## 🔑 Demo Credentials

| Role | Email | Password | Name |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@aceacademy.edu` | `Ace@12345` | Dr. Vikramaditya Rao |
| **Teacher** | `rajesh.sharma@aceacademy.edu` | `Ace@12345` | Prof. Rajesh Sharma (Physics) |
| **Student** | `aarav.mehta@student.aceacademy.edu` | `Ace@12345` | Aarav Mehta (Roll: ACE-2026-001) |

*Tip: The login page features 1-click autofill buttons for rapid testing across all roles.*

---

## 🚀 Windows Run Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally on port 5432 or via Docker Compose)

### 1. Database Setup
The application uses PostgreSQL with Prisma ORM.

If PostgreSQL is running locally on port 5432:
```powershell
cd academy-platform\backend
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
```

*(Alternatively, use Docker Compose)*:
```bash
docker-compose up -d
```

### 2. Start Backend Server
```powershell
cd academy-platform\backend
npm run dev
```
Backend API will start at **http://localhost:5000** (Healthcheck: `http://localhost:5000/api/health`).

### 3. Start Frontend Client
In a new terminal:
```powershell
cd academy-platform\frontend
npm run dev
```
Frontend Web Application will start at **http://localhost:5173**.

*(Or simply double-click `start-platform.bat` to launch both automatically on Windows!)*

---

## 🧪 Verified Automated Test Suite

Run backend integration tests:
```powershell
cd academy-platform\backend
npm test
```

### Verified Test Results:
```
✓ src/__tests__/api.test.ts (17 tests)
  ✓ Authentication & Role Permissions
    ✓ returns healthy status on /api/health
    ✓ denies student access to admin overview (403 Forbidden)
    ✓ denies unauthenticated requests (401 Unauthorized)
    ✓ allows admin access to admin overview
  ✓ Student Management & Registration
    ✓ admin can register a new student with batch enrollment and parent contact
    ✓ newly registered student can log in
  ✓ QR Code Attendance & Absentee Workflow
    ✓ scans QR code and records check-in
    ✓ detects duplicate check-in on the same date
    ✓ identifies absentees and pending verification in absentee workflow
  ✓ Timetable Management & Conflict Validation
    ✓ fetches weekly timetable for a batch
    ✓ blocks teacher schedule conflicts (cannot double book)
  ✓ Marks Entry & Analytics
    ✓ creates an examination and allows marks entry with ranks auto-computed
    ✓ publishes results and verifies student can see their score
    ✓ returns student comprehensive performance analytics
  ✓ Notes & Study Materials
    ✓ returns hierarchical notes tree: Course -> Subject -> Chapter -> Notes
  ✓ WhatsApp Progress Reports
    ✓ previews formatted WhatsApp message with actual student metrics
    ✓ dispatches progress report and records in WhatsAppDeliveryLog
```
**17 of 17 tests passing (100% success rate).**

