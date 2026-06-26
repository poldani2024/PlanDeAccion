import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const reviewSchema = z.object({
  objectiveId: z.string(),
  weekNumber: z.number().int().min(1).max(53),
  year: z.number().int(),
  whatWorked: z.string().optional(),
  whatDidntWork: z.string().optional(),
  learnings: z.string().optional(),
  whatToChange: z.string().optional(),
  nextWeekPlan: z.string().optional(),
  overallRating: z.number().int().min(1).max(10).optional().nullable(),
});

function getWeekNumber(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7),
    year: d.getUTCFullYear(),
  };
}

router.get('/objective/:objectiveId', async (req: AuthRequest, res: Response) => {
  try {
    const objective = await prisma.objective.findFirst({
      where: { id: req.params.objectiveId, userId: req.userId! },
    });
    if (!objective) return res.status(404).json({ error: 'Objetivo no encontrado' });
    const reviews = await prisma.weeklyReview.findMany({
      where: { objectiveId: req.params.objectiveId },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });
    res.json(reviews);
  } catch {
    res.status(500).json({ error: 'Error al obtener revisiones' });
  }
});

router.get('/pending', async (req: AuthRequest, res: Response) => {
  try {
    const { week, year } = getWeekNumber(new Date());
    const objectives = await prisma.objective.findMany({
      where: { userId: req.userId!, status: 'ACTIVE' },
      select: { id: true, title: true },
    });
    const pending = [];
    for (const obj of objectives) {
      const review = await prisma.weeklyReview.findUnique({
        where: { objectiveId_weekNumber_year: { objectiveId: obj.id, weekNumber: week, year } },
      });
      if (!review) pending.push(obj);
    }
    res.json(pending);
  } catch {
    res.status(500).json({ error: 'Error al verificar revisiones pendientes' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = reviewSchema.parse(req.body);
    const objective = await prisma.objective.findFirst({
      where: { id: data.objectiveId, userId: req.userId! },
    });
    if (!objective) return res.status(404).json({ error: 'Objetivo no encontrado' });
    const review = await prisma.weeklyReview.upsert({
      where: {
        objectiveId_weekNumber_year: {
          objectiveId: data.objectiveId,
          weekNumber: data.weekNumber,
          year: data.year,
        },
      },
      update: data,
      create: data,
    });
    res.status(201).json(review);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message });
    res.status(500).json({ error: 'Error al guardar revisión' });
  }
});

export default router;
