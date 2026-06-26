export type ObjectiveStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ARCHIVED';
export type ActionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'SKIPPED';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
export type EnergyLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type BlockerType = 'PROCRASTINATION' | 'FORGOT' | 'NO_TIME' | 'LOST_MOTIVATION' | 'FEAR' | 'DISTRACTED' | 'DIDNT_KNOW_HOW' | 'OTHER';
export type NlpTechnique = 'REFRAMING' | 'ANCHORING' | 'SWITCH_PATTERN' | 'SUBMODALITIES' | 'PARTS_INTEGRATION' | 'LOGICAL_LEVELS' | 'TIMELINE';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  timezone: string;
  settings?: UserSettings;
}

export interface UserSettings {
  theme: string;
  language: string;
  notifications: boolean;
  weeklyReviewDay: number;
  reminderTime: string;
}

export interface Objective {
  id: string;
  userId: string;
  title: string;
  positiveIntention: string;
  values: string[];
  evidence: string;
  currentState: string;
  availableResources: string[];
  neededResources: string[];
  obstacles: string[];
  positiveConsequences: string[];
  negativeConsequences: string[];
  status: ObjectiveStatus;
  targetDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  actions?: Action[];
  _count?: { actions: number; dailyLogs: number };
}

export interface Action {
  id: string;
  objectiveId: string;
  title: string;
  description?: string;
  estimatedTime?: number;
  difficulty: Difficulty;
  energyLevel: EnergyLevel;
  targetDate?: string;
  priority: Priority;
  category?: string;
  status: ActionStatus;
  notes?: string;
  order: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  id: string;
  objectiveId: string;
  date: string;
  emotionBefore: number;
  emotionAfter?: number;
  motivationLevel: number;
  energyLevel: number;
  timeInvested?: number;
  comments?: string;
  learnings?: string;
  blockerType?: BlockerType;
  blockerNote?: string;
  actionLogs?: ActionLog[];
  createdAt: string;
}

export interface ActionLog {
  id: string;
  dailyLogId: string;
  actionId: string;
  completed: boolean;
  timeSpent?: number;
  note?: string;
  action?: Action;
}

export interface WeeklyReview {
  id: string;
  objectiveId: string;
  weekNumber: number;
  year: number;
  whatWorked?: string;
  whatDidntWork?: string;
  learnings?: string;
  whatToChange?: string;
  nextWeekPlan?: string;
  overallRating?: number;
  createdAt: string;
}

export interface DashboardStats {
  activeObjectives: number;
  completedObjectives: number;
  totalActions: number;
  completedActions: number;
  totalTimeInvested: number;
  avgMotivation: number;
  avgEnergy: number;
  streak: number;
  upcomingActions: (Action & { objective: { title: string } })[];
}

export interface ObjectiveStats {
  progress: number;
  totalActions: number;
  completedActions: number;
  totalTimeInvested: number;
  motivationData: { date: string; motivation: number; energy: number; emotion: number }[];
  blockerStats: Record<string, number>;
  nextAction?: Action;
  streak: number;
}

export interface NlpTechniqueInfo {
  key: NlpTechnique;
  name: string;
  description: string;
  stepCount: number;
  steps?: { title: string; instruction: string; reflection?: string }[];
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  unlockedAt: string;
  achievement: Achievement;
}
