import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart2, Clock, Target, Flame, Zap, Heart, TrendingUp } from 'lucide-react';
import { statsApi } from '../lib/api';
import { Card } from '../components/ui/Card';
import { formatMinutes } from '../lib/utils';
import type { DashboardStats } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';

function ActivityHeatmap({ data }: { data: Record<string, { count: number; totalTime: number }> }) {
  const today = new Date();
  const weeks = 14;
  const days = weeks * 7;
  const cells = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().split('T')[0];
    const entry = data[key];
    return { date: key, level: entry ? Math.min(4, entry.count) : 0, day: d.getDay() };
  });

  const colors = ['#f3f4f6', '#c7d2fe', '#818cf8', '#4f46e5', '#3730a3'];

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)`, gridTemplateRows: 'repeat(7, 1fr)' }}>
        {cells.map((cell, i) => (
          <div
            key={i}
            title={cell.date}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: colors[cell.level], gridRow: (cell.day + 1) }}
          />
        ))}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => statsApi.dashboard().then(r => r.data),
  });

  const { data: heatmap = {} } = useQuery<Record<string, { count: number; totalTime: number }>>({
    queryKey: ['activity-heatmap'],
    queryFn: () => statsApi.heatmap().then(r => r.data),
  });

  const completionRate = stats && stats.totalActions > 0
    ? Math.round((stats.completedActions / stats.totalActions) * 100)
    : 0;

  const summaryStats = [
    { icon: Target, label: 'Objetivos creados', value: (stats?.activeObjectives ?? 0) + (stats?.completedObjectives ?? 0), color: 'text-indigo-600' },
    { icon: TrendingUp, label: 'Objetivos completados', value: stats?.completedObjectives ?? 0, color: 'text-emerald-600' },
    { icon: BarChart2, label: 'Acciones totales', value: stats?.totalActions ?? 0, color: 'text-violet-600' },
    { icon: Clock, label: 'Tiempo invertido', value: stats ? formatMinutes(stats.totalTimeInvested) : '0', color: 'text-blue-600' },
    { icon: Flame, label: 'Racha actual', value: `${stats?.streak ?? 0} días`, color: 'text-orange-600' },
    { icon: Zap, label: 'Motivación promedio', value: stats?.avgMotivation ?? 0, color: 'text-amber-600' },
    { icon: Heart, label: 'Energía promedio', value: stats?.avgEnergy ?? 0, color: 'text-rose-600' },
    { icon: TrendingUp, label: 'Tasa de completado', value: `${completionRate}%`, color: 'text-indigo-600' },
  ];

  const barData = [
    { name: 'Activos', value: stats?.activeObjectives ?? 0 },
    { name: 'Completados', value: stats?.completedObjectives ?? 0 },
    { name: 'Acciones', value: stats?.completedActions ?? 0 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-gray-500 text-sm mt-0.5">Tu progreso en números.</p>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryStats.map((stat) => (
          <Card key={stat.label} padding="sm">
            <stat.icon size={16} className={`${stat.color} mb-2`} />
            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Overview chart */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Resumen general</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={barData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {barData.map((_, i) => (
                <Cell key={i} fill={['#6366f1', '#10b981', '#8b5cf6'][i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Activity heatmap */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Actividad reciente</h2>
        <ActivityHeatmap data={heatmap} />
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-xs text-gray-400">Menos</span>
          {['#f3f4f6', '#c7d2fe', '#818cf8', '#4f46e5', '#3730a3'].map((c) => (
            <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
          ))}
          <span className="text-xs text-gray-400">Más</span>
        </div>
      </Card>
    </motion.div>
  );
}
