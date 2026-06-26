import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [activeObjectives, completedObjectives, totalActions, completedActions, allLogs] = await Promise.all([
      prisma.objective.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.objective.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.action.count({ where: { objective: { userId } } }),
      prisma.action.count({ where: { objective: { userId }, status: 'COMPLETED' } }),
      prisma.dailyLog.findMany({
        where: { objective: { userId } },
        orderBy: { date: 'desc' },
        take: 90,
      }),
    ]);

    const totalTimeInvested = allLogs.reduce((sum, l) => sum + (l.timeInvested || 0), 0);
    const avgMotivation = allLogs.length > 0
      ? Math.round((allLogs.reduce((s, l) => s + l.motivationLevel, 0) / allLogs.length) * 10) / 10
      : 0;
    const avgEnergy = allLogs.length > 0
      ? Math.round((allLogs.reduce((s, l) => s + l.energyLevel, 0) / allLogs.length) * 10) / 10
      : 0;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const logDates = new Set(allLogs.map(l => l.date.toISOString().split('T')[0]));
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      if (logDates.has(d.toISOString().split('T')[0])) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Upcoming actions
    const upcomingActions = await prisma.action.findMany({
      where: {
        objective: { userId, status: 'ACTIVE' },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: { objective: { select: { title: true } } },
      orderBy: [{ priority: 'desc' }, { targetDate: 'asc' }, { order: 'asc' }],
      take: 5,
    });

    res.json({
      activeObjectives,
      completedObjectives,
      totalActions,
      completedActions,
      totalTimeInvested,
      avgMotivation,
      avgEnergy,
      streak,
      upcomingActions,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/objective/:objectiveId', async (req: AuthRequest, res: Response) => {
  try {
    const objective = await prisma.objective.findFirst({
      where: { id: req.params.objectiveId, userId: req.userId! },
      include: {
        actions: true,
        dailyLogs: { orderBy: { date: 'asc' } },
      },
    });
    if (!objective) return res.status(404).json({ error: 'Objetivo no encontrado' });

    const totalActions = objective.actions.length;
    const completedActions = objective.actions.filter(a => a.status === 'COMPLETED').length;
    const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
    const totalTimeInvested = objective.dailyLogs.reduce((s, l) => s + (l.timeInvested || 0), 0);

    const motivationData = objective.dailyLogs.map(l => ({
      date: l.date.toISOString().split('T')[0],
      motivation: l.motivationLevel,
      energy: l.energyLevel,
      emotion: l.emotionBefore,
    }));

    const blockerStats = objective.dailyLogs
      .filter(l => l.blockerType)
      .reduce((acc, l) => {
        acc[l.blockerType!] = (acc[l.blockerType!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const nextAction = objective.actions.find(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');

    res.json({
      progress,
      totalActions,
      completedActions,
      totalTimeInvested,
      motivationData,
      blockerStats,
      nextAction,
      streak: objective.dailyLogs.length,
    });
  } catch {
    res.status(500).json({ error: 'Error al obtener estadísticas del objetivo' });
  }
});

router.get('/activity-heatmap', async (req: AuthRequest, res: Response) => {
  try {
    const logs = await prisma.dailyLog.findMany({
      where: { objective: { userId: req.userId! } },
      select: { date: true, motivationLevel: true, timeInvested: true },
      orderBy: { date: 'asc' },
    });
    const heatmap = logs.reduce((acc, l) => {
      const key = l.date.toISOString().split('T')[0];
      if (!acc[key]) acc[key] = { count: 0, totalMotivation: 0, totalTime: 0 };
      acc[key].count++;
      acc[key].totalMotivation += l.motivationLevel;
      acc[key].totalTime += l.timeInvested || 0;
      return acc;
    }, {} as Record<string, { count: number; totalMotivation: number; totalTime: number }>);
    res.json(heatmap);
  } catch {
    res.status(500).json({ error: 'Error al obtener mapa de calor' });
  }
});

export default router;
