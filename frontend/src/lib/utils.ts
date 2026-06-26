import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(date);
}

export function getWeekNumber(date: Date = new Date()): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return {
    week: Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7),
    year: d.getUTCFullYear(),
  };
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Fácil',
  MEDIUM: 'Media',
  HARD: 'Difícil',
  VERY_HARD: 'Muy difícil',
};

export const ENERGY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  BLOCKED: 'Bloqueada',
  SKIPPED: 'Omitida',
};

export const BLOCKER_LABELS: Record<string, string> = {
  PROCRASTINATION: 'Procrastiné',
  FORGOT: 'Me olvidé',
  NO_TIME: 'No tuve tiempo',
  LOST_MOTIVATION: 'Perdí motivación',
  FEAR: 'Tuve miedo',
  DISTRACTED: 'Me distraje',
  DIDNT_KNOW_HOW: 'No sabía cómo seguir',
  OTHER: 'Otro',
};

export function getDifficultyColor(difficulty: string): string {
  const map: Record<string, string> = {
    EASY: 'text-emerald-600 bg-emerald-50',
    MEDIUM: 'text-amber-600 bg-amber-50',
    HARD: 'text-orange-600 bg-orange-50',
    VERY_HARD: 'text-red-600 bg-red-50',
  };
  return map[difficulty] || 'text-gray-600 bg-gray-100';
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    LOW: 'text-gray-500',
    MEDIUM: 'text-blue-500',
    HIGH: 'text-orange-500',
    URGENT: 'text-red-500',
  };
  return map[priority] || 'text-gray-500';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'text-gray-500 bg-gray-100',
    IN_PROGRESS: 'text-blue-600 bg-blue-50',
    COMPLETED: 'text-emerald-600 bg-emerald-50',
    BLOCKED: 'text-red-600 bg-red-50',
    SKIPPED: 'text-gray-400 bg-gray-50',
  };
  return map[status] || 'text-gray-500 bg-gray-100';
}

export function getMoodEmoji(value: number): string {
  if (value <= 2) return '😞';
  if (value <= 4) return '😐';
  if (value <= 6) return '🙂';
  if (value <= 8) return '😊';
  return '🤩';
}
