import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma';
import { authenticate, requireRoles } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import { AuthRequest } from '../types';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticate);

// 1. Get Notes Tree (Course -> Subject -> Chapter -> Notes)
router.get('/tree', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        subjects: {
          include: {
            chapters: {
              include: {
                notes: {
                  where: search && typeof search === 'string'
                    ? {
                        OR: [
                          { title: { contains: search, mode: 'insensitive' } },
                          { description: { contains: search, mode: 'insensitive' } },
                          { fileName: { contains: search, mode: 'insensitive' } },
                        ],
                      }
                    : undefined,
                  orderBy: { createdAt: 'desc' },
                },
              },
              orderBy: { chapterNumber: 'asc' },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes tree' });
  }
});

// 2. Upload Note File (Teacher & Admin)
router.post('/upload', requireRoles([Role.ADMIN, Role.TEACHER]), upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }

    const { chapterId, title, description } = req.body;
    if (!chapterId || !title) {
      res.status(400).json({ error: 'Missing chapterId or title' });
      return;
    }

    const relativeUrl = `/uploads/${file.filename}`;

    const note = await prisma.note.create({
      data: {
        chapterId,
        title,
        description,
        fileUrl: relativeUrl,
        fileName: file.originalname,
        fileSize: file.size,
        uploadedById: req.user!.userId,
        version: 1,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'UPLOAD_NOTE',
        entityType: 'NOTE',
        entityId: note.id,
        details: `Uploaded study material "${title}" (${file.originalname})`,
      },
    });

    res.status(201).json({ message: 'Study material uploaded successfully', note });
  } catch (error: any) {
    console.error('Note upload error:', error);
    res.status(500).json({ error: 'Failed to upload note' });
  }
});

// 3. Create Chapter
router.post('/chapter', requireRoles([Role.ADMIN, Role.TEACHER]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subjectId, chapterNumber, title, description } = req.body;
    const chapter = await prisma.chapter.create({
      data: {
        subjectId,
        chapterNumber: parseInt(chapterNumber, 10),
        title,
        description,
      },
    });

    res.status(201).json(chapter);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create chapter' });
  }
});

// 4. Download file endpoint
router.get('/download/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      res.status(404).json({ error: 'Note file not found.' });
      return;
    }

    const normalizedPath = note.fileUrl.replace(/^\/uploads\//, '');
    const fullPath = path.join(__dirname, '../../uploads', normalizedPath);

    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: 'Physical file is missing from server storage.' });
      return;
    }

    res.download(fullPath, note.fileName);
  } catch (error) {
    res.status(500).json({ error: 'Error downloading file.' });
  }
});

// 5. Delete note
router.delete('/:id', requireRoles([Role.ADMIN, Role.TEACHER]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    // Attempt to delete physical file
    const normalizedPath = note.fileUrl.replace(/^\/uploads\//, '');
    const fullPath = path.join(__dirname, '../../uploads', normalizedPath);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch {}
    }

    await prisma.note.delete({ where: { id } });
    res.json({ message: 'Note deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;

