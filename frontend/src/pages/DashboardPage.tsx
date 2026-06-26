import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Target, Flame, Clock, TrendingUp, ChevronRight, Zap, Heart } from 'lucide-react';
import { statsApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/auth';
import { formatMinutes, getPriorityColor, PRIORITY_LABELS } from '../lib/utils';
import type { DashboardStats } from '../types';

function StatCard({ icon: Icon, label, value, color, subtitle }: {
  icon: typeof Flame; label: string; value: string | number; color: string; subtitle?: string;
}) {
  return (
    <Card padding="md" className="flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </Card>
  );
}

function MoodBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 w-6">{value}</span>
    </div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => statsApi.dashboard().then(r => r.data),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  const completionRate = stats && stats.totalActions > 0
    ? Math.round((stats.completedActions / stats.totalActions) * 100)
    : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {stats?.streak && stats.streak > 0
              ? `Llevas ${stats.streak} día${stats.streak !== 1 ? 's' : ''} consecutivos. ¡Seguí así!`
              : 'Registrá tu actividad de hoy para mantener la racha.'}
          </p>
        </div>
        <Button as={Link} to="/objetivos/nuevo" size="md" className="shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo objetivo</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Target}
          label="Objetivos activos"
          value={stats?.activeObjectives ?? 0}
          color="bg-indigo-500"
          subtitle={`${stats?.completedObjectives ?? 0} completados`}
        />
        <StatCard
          icon={Flame}
          label="Racha actual"
          value={`${stats?.streak ?? 0} días`}
          color="bg-orange-500"
        />
        <StatCard
          icon={Clock}
          label="Horas invertidas"
          value={stats ? formatMinutes(stats.totalTimeInvested) : '0'}
          color="bg-emerald-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Acciones completas"
          value={`${completionRate}%`}
          color="bg-violet-500"
          subtitle={`${stats?.completedActions ?? 0}/${stats?.totalActions ?? 0}`}
        />
      </motion.div>

      {/* Mood & Upcoming */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* State indicators */}
        <motion.div variants={item}>
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Estado promedio</h2>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-amber-500" />
                  <span className="text-sm text-gray-600">Motivación</span>
                </div>
                <MoodBar value={stats?.avgMotivation ?? 0} color="bg-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={14} className="text-rose-500" />
                  <span className="text-sm text-gray-600">Energía</span>
                </div>
                <MoodBar value={stats?.avgEnergy ?? 0} color="bg-rose-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Next actions */}
        <motion.div variants={item}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Próximas acciones</h2>
              <Link to="/objetivos" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                Ver todo
              </Link>
            </div>
            {!stats?.upcomingActions?.length ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">No hay acciones pendientes.</p>
                <p className="text-gray-400 text-xs mt-1">¡Creá un objetivo para empezar!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {stats.upcomingActions.slice(0, 4).map((action) => (
                  <Link
                    key={action.id}
                    to={`/objetivos/${action.objectiveId}`}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-700">
                        {action.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{action.objective.title}</p>
                    </div>
                    <span className={`text-xs font-medium ${getPriorityColor(action.priority)} shrink-0`}>
                      {PRIORITY_LABELS[action.priority]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Quick action */}
      {stats?.activeObjectives === 0 && (
        <motion.div variants={item}>
          <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Target size={22} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Definí tu primer objetivo</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Usá el método PNL para construir un plan de acción sólido hacia el cambio real.
                </p>
              </div>
              <Link to="/objetivos/nuevo">
                <Button size="sm">
                  Empezar <ChevronRight size={14} />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
