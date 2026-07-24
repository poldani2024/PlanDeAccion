import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  collectionGroup,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Objective,
  Action,
  DailyLog,
  WeeklyReview,
  DashboardStats,
  ObjectiveStats,
  Achievement,
  UserAchievement,
} from '../types';

function toISO(ts: Timestamp | string | undefined): string {
  if (!ts) return new Date().toISOString();
  if (typeof ts === 'string') return ts;
  return ts.toDate().toISOString();
}

// ─── OBJECTIVES ────────────────────────────────────────────────────────────

export async function listObjectives(userId: string, status?: string): Promise<Objective[]> {
  let q = query(
    collection(db, 'objectives'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  if (status) {
    q = query(
      collection(db, 'objectives'),
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  }
  const snap = await getDocs(q);
  const objectives: Objective[] = [];
  for (const d of snap.docs) {
    const data = d.data();
    const actionsSnap = await getDocs(
      query(collection(db, 'objectives', d.id, 'actions'), orderBy('order', 'asc'))
    );
    const logsSnap = await getDocs(collection(db, 'objectives', d.id, 'dailyLogs'));
    const actions = actionsSnap.docs.map(a => ({ id: a.id, ...a.data(), createdAt: toISO(a.data().createdAt), updatedAt: toISO(a.data().updatedAt) } as Action));
    objectives.push({
      id: d.id,
      ...data,
      actions,
      _count: { actions: actions.length, dailyLogs: logsSnap.size },
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
    } as Objective);
  }
  return objectives;
}

export async function getObjective(id: string): Promise<Objective> {
  const snap = await getDoc(doc(db, 'objectives', id));
  if (!snap.exists()) throw new Error('Objective not found');
  const data = snap.data();
  const actionsSnap = await getDocs(
    query(collection(db, 'objectives', id, 'actions'), orderBy('order', 'asc'))
  );
  const logsSnap = await getDocs(collection(db, 'objectives', id, 'dailyLogs'));
  const actions = actionsSnap.docs.map(a => ({
    id: a.id,
    ...a.data(),
    createdAt: toISO(a.data().createdAt),
    updatedAt: toISO(a.data().updatedAt),
  } as Action));
  return {
    id: snap.id,
    ...data,
    actions,
    _count: { actions: actions.length, dailyLogs: logsSnap.size },
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  } as Objective;
}

export async function createObjective(userId: string, data: Partial<Objective>): Promise<Objective> {
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, 'objectives'), {
    userId,
    title: data.title ?? '',
    positiveIntention: data.positiveIntention ?? '',
    values: data.values ?? [],
    evidence: data.evidence ?? '',
    currentState: data.currentState ?? '',
    availableResources: data.availableResources ?? [],
    neededResources: data.neededResources ?? [],
    obstacles: data.obstacles ?? [],
    positiveConsequences: data.positiveConsequences ?? [],
    negativeConsequences: data.negativeConsequences ?? [],
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  });
  const snap = await getDoc(ref);
  const d = snap.data()!;
  return {
    id: ref.id,
    ...(d as object),
    actions: [],
    _count: { actions: 0, dailyLogs: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as Objective;
}

export async function updateObjective(id: string, data: Partial<Objective>): Promise<void> {
  await updateDoc(doc(db, 'objectives', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteObjective(id: string): Promise<void> {
  await deleteDoc(doc(db, 'objectives', id));
}

// ─── ACTIONS ───────────────────────────────────────────────────────────────

export async function createAction(objectiveId: string, data: Partial<Action>): Promise<Action> {
  const actionsSnap = await getDocs(collection(db, 'objectives', objectiveId, 'actions'));
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, 'objectives', objectiveId, 'actions'), {
    objectiveId,
    title: data.title ?? '',
    description: data.description ?? null,
    estimatedTime: data.estimatedTime ?? null,
    difficulty: data.difficulty ?? 'EASY',
    energyLevel: data.energyLevel ?? 'LOW',
    priority: data.priority ?? 'MEDIUM',
    category: data.category ?? null,
    notes: data.notes ?? null,
    status: 'PENDING',
    order: actionsSnap.size,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id: ref.id,
    objectiveId,
    status: 'PENDING',
    order: actionsSnap.size,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data,
  } as Action;
}

export async function updateAction(objectiveId: string, actionId: string, data: Partial<Action>): Promise<void> {
  await updateDoc(doc(db, 'objectives', objectiveId, 'actions', actionId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAction(objectiveId: string, actionId: string): Promise<void> {
  await deleteDoc(doc(db, 'objectives', objectiveId, 'actions', actionId));
}

// ─── DAILY LOGS ────────────────────────────────────────────────────────────

export async function createDailyLog(userId: string, data: Omit<Partial<DailyLog>, 'actionLogs'> & { objectiveId: string; actionLogs?: { actionId: string; completed: boolean }[] }): Promise<DailyLog> {
  const { objectiveId, actionLogs = [], ...rest } = data;

  // Mark completed actions in Firestore
  for (const al of actionLogs) {
    if (al.completed) {
      await updateAction(objectiveId, al.actionId, { status: 'COMPLETED' });
    }
  }

  const now = serverTimestamp();
  const ref = await addDoc(collection(db, 'objectives', objectiveId, 'dailyLogs'), {
    userId,
    objectiveId,
    ...rest,
    createdAt: now,
  });
  return {
    id: ref.id,
    objectiveId,
    createdAt: new Date().toISOString(),
    ...rest,
  } as DailyLog;
}

export async function getTodayLog(objectiveId: string): Promise<DailyLog | null> {
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, 'objectives', objectiveId, 'dailyLogs'),
    where('date', '==', today)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) } as DailyLog;
}

export async function listDailyLogs(objectiveId: string): Promise<DailyLog[]> {
  const snap = await getDocs(
    query(collection(db, 'objectives', objectiveId, 'dailyLogs'), orderBy('date', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) } as DailyLog));
}

// ─── WEEKLY REVIEWS ────────────────────────────────────────────────────────

export async function createWeeklyReview(objectiveId: string, data: Partial<WeeklyReview>): Promise<WeeklyReview> {
  const now = serverTimestamp();
  const ref = await addDoc(collection(db, 'objectives', objectiveId, 'weeklyReviews'), {
    objectiveId,
    ...data,
    createdAt: now,
  });
  return { id: ref.id, objectiveId, createdAt: new Date().toISOString(), ...data } as WeeklyReview;
}

export async function listWeeklyReviews(objectiveId: string): Promise<WeeklyReview[]> {
  const snap = await getDocs(
    query(collection(db, 'objectives', objectiveId, 'weeklyReviews'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toISO(d.data().createdAt) } as WeeklyReview));
}

// ─── STATS ─────────────────────────────────────────────────────────────────

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const objectivesSnap = await getDocs(
    query(collection(db, 'objectives'), where('userId', '==', userId))
  );

  let activeObjectives = 0;
  let completedObjectives = 0;
  let totalActions = 0;
  let completedActions = 0;
  const upcomingActions: (Action & { objective: { title: string } })[] = [];

  for (const d of objectivesSnap.docs) {
    const obj = d.data();
    if (obj.status === 'ACTIVE') activeObjectives++;
    if (obj.status === 'COMPLETED') completedObjectives++;

    const actionsSnap = await getDocs(
      query(collection(db, 'objectives', d.id, 'actions'), orderBy('order', 'asc'))
    );
    for (const a of actionsSnap.docs) {
      const action = a.data() as Action;
      totalActions++;
      if (action.status === 'COMPLETED') completedActions++;
      else if ((action.status === 'PENDING' || action.status === 'IN_PROGRESS') && upcomingActions.length < 4) {
        upcomingActions.push({ ...action, id: a.id, objective: { title: obj.title as string }, createdAt: toISO(action.createdAt as unknown as Timestamp), updatedAt: toISO(action.updatedAt as unknown as Timestamp) });
      }
    }
  }

  // Compute streak and averages from daily logs across all objectives
  const logsSnap = await getDocs(
    query(collectionGroup(db, 'dailyLogs'), where('userId', '==', userId))
  );

  const logsByDate = new Map<string, { motivation: number[]; energy: number[]; time: number }>();
  let totalTimeInvested = 0;
  for (const d of logsSnap.docs) {
    const log = d.data();
    const date = log.date as string;
    if (!logsByDate.has(date)) logsByDate.set(date, { motivation: [], energy: [], time: 0 });
    const entry = logsByDate.get(date)!;
    entry.motivation.push(log.motivationLevel ?? 0);
    entry.energy.push(log.energyLevel ?? 0);
    entry.time += log.timeInvested ?? 0;
    totalTimeInvested += log.timeInvested ?? 0;
  }

  const sortedDates = Array.from(logsByDate.keys()).sort((a, b) => b.localeCompare(a));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (logsByDate.has(key)) streak++;
    else if (i > 0) break;
  }

  const allMotivations = sortedDates.slice(0, 30).flatMap(d => logsByDate.get(d)!.motivation);
  const allEnergies = sortedDates.slice(0, 30).flatMap(d => logsByDate.get(d)!.energy);
  const avgMotivation = allMotivations.length ? Math.round(allMotivations.reduce((a, b) => a + b, 0) / allMotivations.length) : 0;
  const avgEnergy = allEnergies.length ? Math.round(allEnergies.reduce((a, b) => a + b, 0) / allEnergies.length) : 0;

  return {
    activeObjectives,
    completedObjectives,
    totalActions,
    completedActions,
    totalTimeInvested,
    avgMotivation,
    avgEnergy,
    streak,
    upcomingActions,
  };
}

export async function getObjectiveStats(objectiveId: string): Promise<ObjectiveStats> {
  const actionsSnap = await getDocs(collection(db, 'objectives', objectiveId, 'actions'));
  const totalActions = actionsSnap.size;
  const completedActions = actionsSnap.docs.filter(d => d.data().status === 'COMPLETED').length;

  const logsSnap = await getDocs(
    query(collection(db, 'objectives', objectiveId, 'dailyLogs'), orderBy('date', 'asc'))
  );

  let totalTimeInvested = 0;
  const motivationData: { date: string; motivation: number; energy: number; emotion: number }[] = [];
  const blockerStats: Record<string, number> = {};

  for (const d of logsSnap.docs) {
    const log = d.data();
    totalTimeInvested += log.timeInvested ?? 0;
    motivationData.push({
      date: log.date,
      motivation: log.motivationLevel ?? 0,
      energy: log.energyLevel ?? 0,
      emotion: log.emotionBefore ?? 0,
    });
    if (log.blockerType) {
      blockerStats[log.blockerType] = (blockerStats[log.blockerType] ?? 0) + 1;
    }
  }

  const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  const nextActionDoc = actionsSnap.docs.find(d => d.data().status === 'PENDING' || d.data().status === 'IN_PROGRESS');
  const nextAction = nextActionDoc
    ? ({ id: nextActionDoc.id, ...nextActionDoc.data(), createdAt: toISO(nextActionDoc.data().createdAt), updatedAt: toISO(nextActionDoc.data().updatedAt) } as Action)
    : undefined;

  return {
    progress,
    totalActions,
    completedActions,
    totalTimeInvested,
    motivationData,
    blockerStats,
    nextAction,
    streak: logsSnap.size,
  };
}

export async function getActivityHeatmap(userId: string): Promise<Record<string, { count: number; totalTime: number }>> {
  const snap = await getDocs(
    query(collectionGroup(db, 'dailyLogs'), where('userId', '==', userId))
  );
  const result: Record<string, { count: number; totalTime: number }> = {};
  for (const d of snap.docs) {
    const log = d.data();
    const date = log.date as string;
    if (!result[date]) result[date] = { count: 0, totalTime: 0 };
    result[date].count++;
    result[date].totalTime += log.timeInvested ?? 0;
  }
  return result;
}

// ─── ACHIEVEMENTS (hardcoded, tracked in Firestore) ───────────────────────

export const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-objective', key: 'first-objective', name: 'Primer Paso', description: 'Creaste tu primer objetivo', icon: '🎯', category: 'start' },
  { id: 'first-log', key: 'first-log', name: 'Primer Registro', description: 'Completaste tu primer registro diario', icon: '📔', category: 'streak' },
  { id: 'streak-7', key: 'streak-7', name: 'Semana Perfecta', description: '7 días consecutivos registrando actividad', icon: '🔥', category: 'streak' },
  { id: 'streak-30', key: 'streak-30', name: 'Mes de Fuego', description: '30 días consecutivos de actividad', icon: '🌟', category: 'streak' },
  { id: 'first-action', key: 'first-action', name: 'Acción en Marcha', description: 'Completaste tu primera acción', icon: '⚡', category: 'action' },
  { id: 'actions-10', key: 'actions-10', name: 'En Movimiento', description: '10 acciones completadas', icon: '🏃', category: 'action' },
  { id: 'actions-50', key: 'actions-50', name: 'Imparable', description: '50 acciones completadas', icon: '💪', category: 'action' },
  { id: 'objective-complete', key: 'objective-complete', name: 'Objetivo Logrado', description: 'Completaste un objetivo completo', icon: '🏆', category: 'completion' },
  { id: 'nlp-session', key: 'nlp-session', name: 'Explorador PNL', description: 'Realizaste tu primera sesión de PNL', icon: '🧠', category: 'nlp' },
];

export async function listAchievements(userId: string): Promise<{ earned: UserAchievement[]; all: Achievement[] }> {
  const snap = await getDocs(
    query(collection(db, 'userAchievements'), where('userId', '==', userId))
  );
  const earned: UserAchievement[] = snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      achievementId: data.achievementId,
      unlockedAt: toISO(data.unlockedAt),
      achievement: ALL_ACHIEVEMENTS.find(a => a.id === data.achievementId) ?? ALL_ACHIEVEMENTS[0],
    };
  });
  return { earned, all: ALL_ACHIEVEMENTS };
}

export async function unlockAchievement(userId: string, achievementId: string): Promise<void> {
  const existing = await getDocs(
    query(
      collection(db, 'userAchievements'),
      where('userId', '==', userId),
      where('achievementId', '==', achievementId)
    )
  );
  if (existing.empty) {
    await addDoc(collection(db, 'userAchievements'), {
      userId,
      achievementId,
      unlockedAt: serverTimestamp(),
    });
  }
}

// ─── NLP SESSIONS ──────────────────────────────────────────────────────────

export async function createNlpSession(userId: string, data: Record<string, unknown>): Promise<void> {
  await addDoc(collection(db, 'nlpSessions'), {
    userId,
    ...data,
    createdAt: serverTimestamp(),
  });
}
