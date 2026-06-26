import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const objectiveSchema = z.object({
  title: z.string().min(1).max(500),
  positiveIntention: z.string().optional().default(''),
  values: z.array(z.string()).optional().default([]),
  evidence: z.string().optional().default(''),
  currentState: z.string().optional().default(''),
  availableResources: z.array(z.string()).optional().default([]),
  neededResources: z.array(z.string()).optional().default([]),
  obstacles: z.array(z.string()).optional().default([]),
  positiveConsequences: z.array(z.string()).optional().default([]),
  negativeConsequences: z.array(z.string()).optional().default([]),
  targetDate: z.string().optional().nullable(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const objectives = await prisma.objective.findMany({
      where: {
        userId: req.userId!,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        actions: { orderBy: { order: 'asc' } },
        _count: { select: { actions: true, dailyLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(objectives);
  } catch {
    res.status(500).json({ error: 'Error al obtener objetivos' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = objectiveSchema.parse(req.body);
    const objective = await prisma.objective.create({
      data: {
        userId: req.userId!,
        title: data.title,
        positiveIntention: data.positiveIntention,
        values: data.values,
        evidence: data.evidence,
        currentState: data.currentState,
        availableResources: data.availableResources,
        neededResources: data.neededResources,
        obstacles: data.obstacles,
        positiveConsequences: data.positiveConsequences,
        negativeConsequences: data.negativeConsequences,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      },
      include: { actions: true },
    });
    res.status(201).json(objective);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Error al crear objetivo' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const objective = await prisma.objective.findFirst({
      where: { id: req.params.id, userId: req.userId! },
      include: {
        actions: { orderBy: { order: 'asc' } },
        dailyLogs: { orderBy: { date: 'desc' }, take: 30 },
        weeklyReviews: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!objective) return res.status(404).json({ error: 'Objetivo no encontrado' });
    res.json(objective);
  } catch {
    res.status(500).json({ error: 'Error al obtener objetivo' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.objective.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!existing) return res.status(404).json({ error: 'Objetivo no encontrado' });
    const data = objectiveSchema.partial().parse(req.body);
    const objective = await prisma.objective.update({
      where: { id: req.params.id },
      data: {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
      include: { actions: { orderBy: { order: 'asc' } } },
    });
    res.json(objective);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Error al actualizar objetivo' });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const existing = await prisma.objective.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!existing) return res.status(404).json({ error: 'Objetivo no encontrado' });
    const objective = await prisma.objective.update({
      where: { id: req.params.id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });
    res.json(objective);
  } catch {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.objective.findFirst({
      where: { id: req.params.id, userId: req.userId! },
    });
    if (!existing) return res.status(404).json({ error: 'Objetivo no encontrado' });
    await prisma.objective.delete({ where: { id: req.params.id } });
    res.json({ message: 'Objetivo eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar objetivo' });
  }
});

export default router;
