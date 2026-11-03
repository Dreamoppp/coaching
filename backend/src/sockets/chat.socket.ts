import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { TokenPayload } from '../types';
import prisma from '../prisma';

let ioInstance: Server | null = null;
const onlineUsers = new Map<string, string>(); // userId -> socketId

export function setupSocketIO(server: HttpServer): Server {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Missing token'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as TokenPayload;
    onlineUsers.set(user.userId, socket.id);
    io.emit('user_online', { userId: user.userId, status: 'online' });

    // Join user's personal channel
    socket.join(`user_${user.userId}`);

    // Join conversation rooms
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conv_${conversationId}`);
    });

    // Real-time message sending
    socket.on('send_message', async (data: { conversationId: string; content: string; attachmentUrl?: string }) => {
      try {
        const { conversationId, content, attachmentUrl } = data;
        if (!content || !conversationId) return;

        // Persist message in PostgreSQL
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: user.userId,
            content,
            attachmentUrl,
          },
          include: {
            sender: {
              select: { id: true, name: true, role: true, avatar: true },
            },
          },
        });

        // Broadcast to everyone in conversation room
        io.to(`conv_${conversationId}`).emit('new_message', message);
      } catch (error) {
        console.error('Socket message error:', error);
      }
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(user.userId);
      io.emit('user_offline', { userId: user.userId, status: 'offline' });
    });
  });

  ioInstance = io;
  return io;
}

export function getSocketIO(): Server | null {
  return ioInstance;
}

