import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId: req.userId! },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });
    const all = await prisma.achievement.findMany();
    res.json({ earned: userAchievements, all });
  } catch {
    res.status(500).json({ error: 'Error al obtener logros' });
  }
});

export default router;
