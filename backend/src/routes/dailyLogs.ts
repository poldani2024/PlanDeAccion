import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const dailyLogSchema = z.object({
  objectiveId: z.string(),
  date: z.string(),
  emotionBefore: z.number().int().min(1).max(10),
  emotionAfter: z.number().int().min(1).max(10).optional().nullable(),
  motivationLevel: z.number().int().min(1).max(10),
  energyLevel: z.number().int().min(1).max(10),
  timeInvested: z.number().int().positive().optional().nullable(),
  comments: z.string().optional(),
  learnings: z.string().optional(),
  blockerType: z.enum(['PROCRASTINATION','FORGOT','NO_TIME','LOST_MOTIVATION','FEAR','DISTRACTED','DIDNT_KNOW_HOW','OTHER']).optional().nullable(),
  blockerNote: z.string().optional(),
  actionLogs: z.array(z.object({
    actionId: z.string(),
    completed: z.boolean(),
    timeSpent: z.number().int().positive().optional().nullable(),
    note: z.string().optional(),
  })).optional().default([]),
});

router.get('/objective/:objectiveId', async (req: AuthRequest, res: Response) => {
  try {
    const objective = await prisma.objective.findFirst({
      where: { id: req.params.objectiveId, userId: req.userId! },
    });
    if (!objective) return res.status(404).json({ error: 'Objetivo no encontrado' });
    const logs = await prisma.dailyLog.findMany({
      where: { objectiveId: req.params.objectiveId },
      include: { actionLogs: { include: { action: true } } },
      orderBy: { date: 'desc' },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = dailyLogSchema.parse(req.body);
    const objective = await prisma.objective.findFirst({
      where: { id: data.objectiveId, userId: req.userId! },
    });
    if (!objective) return res.status(404).json({ error: 'Objetivo no encontrado' });

    const date = new Date(data.date);
    date.setUTCHours(0, 0, 0, 0);

    const log = await prisma.dailyLog.upsert({
      where: { objectiveId_date: { objectiveId: data.objectiveId, date } },
      update: {
        emotionBefore: data.emotionBefore,
        emotionAfter: data.emotionAfter,
        motivationLevel: data.motivationLevel,
        energyLevel: data.energyLevel,
        timeInvested: data.timeInvested,
        comments: data.comments,
        learnings: data.learnings,
        blockerType: data.blockerType,
        blockerNote: data.blockerNote,
      },
      create: {
        objectiveId: data.objectiveId,
        date,
        emotionBefore: data.emotionBefore,
        emotionAfter: data.emotionAfter,
        motivationLevel: data.motivationLevel,
        energyLevel: data.energyLevel,
        timeInvested: data.timeInvested,
        comments: data.comments,
        learnings: data.learnings,
        blockerType: data.blockerType,
        blockerNote: data.blockerNote,
      },
    });

    if (data.actionLogs && data.actionLogs.length > 0) {
      await prisma.actionLog.deleteMany({ where: { dailyLogId: log.id } });
      await prisma.actionLog.createMany({
        data: data.actionLogs.map(al => ({
          dailyLogId: log.id,
          actionId: al.actionId,
          completed: al.completed,
          timeSpent: al.timeSpent,
          note: al.note,
        })),
      });
      if (data.actionLogs.some(al => al.completed)) {
        await prisma.action.updateMany({
          where: {
            id: { in: data.actionLogs.filter(al => al.completed).map(al => al.actionId) },
          },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }
    }

    const fullLog = await prisma.dailyLog.findUnique({
      where: { id: log.id },
      include: { actionLogs: { include: { action: true } } },
    });
    res.status(201).json(fullLog);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Error al guardar registro diario' });
  }
});

router.get('/today/:objectiveId', async (req: AuthRequest, res: Response) => {
  try {
    const objective = await prisma.objective.findFirst({
      where: { id: req.params.objectiveId, userId: req.userId! },
    });
    if (!objective) return res.status(404).json({ error: 'Objetivo no encontrado' });
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const log = await prisma.dailyLog.findUnique({
      where: { objectiveId_date: { objectiveId: req.params.objectiveId, date: today } },
      include: { actionLogs: { include: { action: true } } },
    });
    res.json(log);
  } catch {
    res.status(500).json({ error: 'Error al obtener registro de hoy' });
  }
});

export default router;
