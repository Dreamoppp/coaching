import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { authenticate } from '../middlewares/auth';
import { AuthRequest } from '../types';
import { getSocketIO } from '../sockets/chat.socket';
import { ConversationType } from '@prisma/client';

const router = Router();
router.use(authenticate);

// 1. Get user's conversations
router.get('/conversations', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        batch: { select: { id: true, name: true, batchCode: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, role: true, avatar: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formatted = conversations.map((c) => {
      let displayName = c.title;
      let displayAvatar = null;

      if (c.type === ConversationType.DIRECT) {
        const otherParticipant = c.participants.find((p) => p.userId !== userId);
        if (otherParticipant) {
          displayName = otherParticipant.user.name;
          displayAvatar = otherParticipant.user.avatar;
        }
      }

      return {
        id: c.id,
        type: c.type,
        title: displayName,
        avatar: displayAvatar,
        batch: c.batch,
        lastMessage: c.messages[0] || null,
        participants: c.participants,
        updatedAt: c.updatedAt,
      };
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// 2. Get messages for a conversation
router.get('/conversations/:id/messages', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Check participation
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId,
        },
      },
    });

    if (!participant && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'You are not a participant in this conversation.' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// 3. Send message via HTTP endpoint
const messageSchema = z.object({
  content: z.string().min(1),
  attachmentUrl: z.string().optional(),
});

router.post('/conversations/:id/messages', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, attachmentUrl } = messageSchema.parse(req.body);
    const userId = req.user!.userId;

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: userId,
        content,
        attachmentUrl,
      },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } },
      },
    });

    // Touch conversation updated timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Emit to socket room
    const io = getSocketIO();
    if (io) {
      io.to(`conv_${id}`).emit('new_message', message);
    }

    res.status(201).json(message);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to send message' });
  }
});

// 4. Create or Get Direct Chat between two users
router.post('/conversations/direct', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user!.userId;

    if (!targetUserId) {
      res.status(400).json({ error: 'Missing targetUserId' });
      return;
    }

    // Check if direct conversation already exists
    const existing = await prisma.conversation.findFirst({
      where: {
        type: ConversationType.DIRECT,
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
    });

    if (existing) {
      res.json(existing);
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      res.status(404).json({ error: 'Target user not found' });
      return;
    }

    const newConv = await prisma.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        title: `${req.user!.name} & ${targetUser.name}`,
        participants: {
          create: [{ userId: currentUserId }, { userId: targetUserId }],
        },
      },
    });

    res.status(201).json(newConv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate direct chat' });
  }
});

export default router;

