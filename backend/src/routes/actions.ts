import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const actionSchema = z.object({
  objectiveId: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  estimatedTime: z.number().int().positive().optional().nullable(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'VERY_HARD']).optional(),
  energyLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  targetDate: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  order: z.number().int().optional(),
});

router.get('/objective/:objectiveId', async (req: AuthRequest, res: Response) => {
  try {
    const objective = await prisma.objective.findFirst({
      where: { id: req.params.objectiveId, userId: req.userId! },
    });
    if (!objective) return res.status(404).json({ error: 'Objetivo no encontrado' });
    const actions = await prisma.action.findMany({
      where: { objectiveId: req.params.objectiveId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(actions);
  } catch {
    res.status(500).json({ error: 'Error al obtener acciones' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = actionSchema.parse(req.body);
    const objective = await prisma.objective.findFirst({
      where: { id: data.objectiveId, userId: req.userId! },
    });
    if (!objective) return res.status(404).json({ error: 'Objetivo no encontrado' });
    const lastAction = await prisma.action.findFirst({
      where: { objectiveId: data.objectiveId },
      orderBy: { order: 'desc' },
    });
    const action = await prisma.action.create({
      data: {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        order: data.order ?? (lastAction ? lastAction.order + 1 : 0),
      },
    });
    res.status(201).json(action);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Error al crear acción' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const action = await prisma.action.findFirst({
      where: { id: req.params.id },
      include: { objective: true },
    });
    if (!action || action.objective.userId !== req.userId!) {
      return res.status(404).json({ error: 'Acción no encontrada' });
    }
    const data = actionSchema.partial().parse(req.body);
    const updated = await prisma.action.update({
      where: { id: req.params.id },
      data: {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : data.targetDate === null ? null : undefined,
        completedAt: data.status === 'COMPLETED' ? new Date() : data.status ? null : undefined,
      },
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Error al actualizar acción' });
  }
});

router.patch('/reorder', async (req: AuthRequest, res: Response) => {
  try {
    const { actions } = req.body as { actions: { id: string; order: number }[] };
    await Promise.all(
      actions.map(({ id, order }) => prisma.action.update({ where: { id }, data: { order } }))
    );
    res.json({ message: 'Orden actualizado' });
  } catch {
    res.status(500).json({ error: 'Error al reordenar acciones' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const action = await prisma.action.findFirst({
      where: { id: req.params.id },
      include: { objective: true },
    });
    if (!action || action.objective.userId !== req.userId!) {
      return res.status(404).json({ error: 'Acción no encontrada' });
    }
    await prisma.action.delete({ where: { id: req.params.id } });
    res.json({ message: 'Acción eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar acción' });
  }
});

export default router;
