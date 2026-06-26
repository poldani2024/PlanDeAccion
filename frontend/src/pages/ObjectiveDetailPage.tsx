import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Plus, CheckCircle2, Circle, Clock, Zap, ArrowRight,
  BarChart2, Calendar, BookOpen, Brain, Target, Flame
} from 'lucide-react';
import { objectivesApi, actionsApi, statsApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressRing } from '../components/ui/ProgressRing';
import { formatMinutes, DIFFICULTY_LABELS, PRIORITY_LABELS, getDifficultyColor, getPriorityColor } from '../lib/utils';
import type { Objective, Action, ObjectiveStats } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function ActionItem({ action, onToggle }: { action: Action; onToggle: () => void }) {
  const isCompleted = action.status === 'COMPLETED';
  return (
    <motion.div
      layout
      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
        isCompleted ? 'border-emerald-100 bg-emerald-50/50' : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <button onClick={onToggle} className="mt-0.5 flex-shrink-0">
        {isCompleted
          ? <CheckCircle2 size={20} className="text-emerald-500" />
          : <Circle size={20} className="text-gray-300 hover:text-indigo-400 transition-colors" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {action.title}
        </p>
        {action.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{action.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {action.estimatedTime && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={10} /> {formatMinutes(action.estimatedTime)}
            </span>
          )}
          <span className={`text-xs px-1.5 py-0.5 rounded-md ${getDifficultyColor(action.difficulty)}`}>
            {DIFFICULTY_LABELS[action.difficulty]}
          </span>
          <span className={`text-xs font-medium ${getPriorityColor(action.priority)}`}>
            {PRIORITY_LABELS[action.priority]}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

type Tab = 'acciones' | 'estadisticas' | 'historial';

export default function ObjectiveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('acciones');

  const { data: objective, isLoading } = useQuery<Objective>({
    queryKey: ['objective', id],
    queryFn: () => objectivesApi.get(id!).then(r => r.data),
  });

  const { data: stats } = useQuery<ObjectiveStats>({
    queryKey: ['objective-stats', id],
    queryFn: () => statsApi.objective(id!).then(r => r.data),
    enabled: tab === 'estadisticas',
  });

  const toggleAction = useMutation({
    mutationFn: ({ actionId, status }: { actionId: string; status: string }) =>
      actionsApi.update(actionId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective', id] });
      queryClient.invalidateQueries({ queryKey: ['objective-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!objective) return null;

  const actions = objective.actions ?? [];
  const completed = actions.filter(a => a.status === 'COMPLETED').length;
  const progress = actions.length > 0 ? Math.round((completed / actions.length) * 100) : 0;
  const nextAction = actions.find(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');

  const tabs: { key: Tab; label: string; icon: typeof Target }[] = [
    { key: 'acciones', label: 'Acciones', icon: Target },
    { key: 'estadisticas', label: 'Estadísticas', icon: BarChart2 },
    { key: 'historial', label: 'Historial', icon: Calendar },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate('/objetivos')} className="p-2 rounded-xl hover:bg-gray-100 mt-0.5">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="info" size="sm">Activo</Badge>
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">{objective.title}</h1>
          {objective.positiveIntention && (
            <p className="text-sm text-gray-500 mt-1">
              <span className="text-indigo-500">✦</span> {objective.positiveIntention}
            </p>
          )}
        </div>
        <ProgressRing progress={progress} size={52} strokeWidth={4} />
      </div>

      {/* Next action highlight */}
      {nextAction && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4"
        >
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">
            👉 Tu próximo paso
          </p>
          <p className="font-semibold text-gray-900">{nextAction.title}</p>
          {nextAction.description && (
            <p className="text-sm text-gray-600 mt-0.5">{nextAction.description}</p>
          )}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => toggleAction.mutate({ actionId: nextAction.id, status: 'COMPLETED' })}
            >
              <CheckCircle2 size={14} /> Completar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              as={Link}
              to={`/objetivos/${id}/registro`}
            >
              <BookOpen size={14} /> Registrar día
            </Button>
          </div>
        </motion.div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: CheckCircle2, label: 'Completadas', value: `${completed}/${actions.length}`, color: 'text-emerald-500' },
          { icon: Flame, label: 'Registros', value: objective._count?.dailyLogs ?? 0, color: 'text-orange-500' },
          { icon: Zap, label: 'Progreso', value: `${progress}%`, color: 'text-indigo-500' },
        ].map((stat) => (
          <Card key={stat.label} padding="sm" className="text-center">
            <stat.icon size={16} className={`${stat.color} mx-auto mb-1`} />
            <p className="font-bold text-gray-900 text-sm">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Actions */}
      {tab === 'acciones' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Plan de Acción</h2>
            <Button size="sm" variant="outline" as={Link} to={`/objetivos/${id}/acciones`}>
              <Plus size={14} /> Agregar
            </Button>
          </div>
          {actions.length === 0 ? (
            <Card className="text-center py-10">
              <ArrowRight size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm mb-3">Todavía no hay acciones definidas.</p>
              <Button size="sm" as={Link} to={`/objetivos/${id}/acciones`}>
                <Plus size={14} /> Crear primer acción
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {actions.map((action) => (
                <ActionItem
                  key={action.id}
                  action={action}
                  onToggle={() => toggleAction.mutate({
                    actionId: action.id,
                    status: action.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED',
                  })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Stats */}
      {tab === 'estadisticas' && stats && (
        <div className="flex flex-col gap-4">
          {stats.motivationData.length > 0 ? (
            <>
              <Card>
                <h3 className="font-semibold text-gray-900 mb-4">Motivación y energía</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={stats.motivationData.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      labelFormatter={(v) => `Fecha: ${v}`}
                      formatter={(v, name) => [`${v}`, String(name) === 'motivation' ? 'Motivación' : 'Energía']}
                    />
                    <Line type="monotone" dataKey="motivation" stroke="#6366f1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="energy" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <h3 className="font-semibold text-gray-900 mb-2">Resumen</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">Tiempo total</p>
                    <p className="font-bold text-gray-900">{formatMinutes(stats.totalTimeInvested)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-500 text-xs">Días registrados</p>
                    <p className="font-bold text-gray-900">{stats.streak}</p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="text-center py-10">
              <BarChart2 size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Registrá actividad para ver estadísticas.</p>
            </Card>
          )}
        </div>
      )}

      {/* Tab: History */}
      {tab === 'historial' && (
        <Card className="text-center py-10">
          <Calendar size={24} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm mb-3">El historial diario aparece aquí.</p>
          <Button size="sm" as={Link} to={`/objetivos/${id}/registro`}>
            <BookOpen size={14} /> Registrar hoy
          </Button>
        </Card>
      )}

      {/* NLP button */}
      <div className="flex">
        <Button variant="ghost" size="sm" as={Link} to="/pnl" className="text-indigo-600">
          <Brain size={14} /> Necesito una técnica PNL
        </Button>
      </div>
    </div>
  );
}
