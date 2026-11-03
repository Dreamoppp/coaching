import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { setupSocketIO } from './sockets/chat.socket';

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import attendanceRoutes from './routes/attendance.routes';
import timetableRoutes from './routes/timetable.routes';
import notesRoutes from './routes/notes.routes';
import marksRoutes from './routes/marks.routes';
import chatRoutes from './routes/chat.routes';
import whatsAppRoutes from './routes/whatsapp.routes';
import notificationRoutes from './routes/notifications.routes';

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
setupSocketIO(server);

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(config.uploadDir));

// Healthcheck
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ACE Academy Management Platform API',
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/whatsapp', whatsAppRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    console.log(`🚀 ACE Academy API Server running at http://localhost:${config.port}`);
    console.log(`📁 Uploads served from ${config.uploadDir}`);
  });
}

export { app, server };

