import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, CheckCircle2, Pause, Archive, MoreHorizontal, ChevronRight } from 'lucide-react';
import { objectivesApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressRing } from '../components/ui/ProgressRing';
import type { Objective } from '../types';

const STATUS_CONFIG = {
  ACTIVE: { label: 'Activo', variant: 'info' as const, icon: Target },
  COMPLETED: { label: 'Completado', variant: 'success' as const, icon: CheckCircle2 },
  PAUSED: { label: 'Pausado', variant: 'warning' as const, icon: Pause },
  ARCHIVED: { label: 'Archivado', variant: 'default' as const, icon: Archive },
};

function ObjectiveCard({ objective }: { objective: Objective }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const config = STATUS_CONFIG[objective.status];

  const total = objective.actions?.length ?? 0;
  const completed = objective.actions?.filter(a => a.status === 'COMPLETED').length ?? 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const updateStatus = useMutation({
    mutationFn: (status: string) => objectivesApi.updateStatus(objective.id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['objectives'] }),
  });

  const nextAction = objective.actions?.find(a => a.status === 'PENDING' || a.status === 'IN_PROGRESS');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <Card hover className="relative group">
        <div className="flex items-start gap-4">
          <ProgressRing progress={progress} size={56} strokeWidth={4} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={config.variant} size="sm">{config.label}</Badge>
            </div>
            <Link to={`/objetivos/${objective.id}`}>
              <h3 className="font-semibold text-gray-900 hover:text-indigo-700 transition-colors line-clamp-2 mb-1">
                {objective.title}
              </h3>
            </Link>
            {nextAction && (
              <p className="text-xs text-gray-500">
                <span className="text-indigo-600">→</span> {nextAction.title}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>{completed}/{total} acciones</span>
              {objective._count && <span>· {objective._count.dailyLogs} registros</span>}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Link to={`/objetivos/${objective.id}`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal size={16} className="text-gray-400" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute right-0 top-10 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    {objective.status !== 'COMPLETED' && (
                      <button onClick={() => { updateStatus.mutate('COMPLETED'); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <CheckCircle2 size={14} className="text-emerald-500" /> Marcar completado
                      </button>
                    )}
                    {objective.status !== 'PAUSED' && objective.status !== 'COMPLETED' && (
                      <button onClick={() => { updateStatus.mutate('PAUSED'); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Pause size={14} className="text-amber-500" /> Pausar
                      </button>
                    )}
                    {objective.status === 'PAUSED' && (
                      <button onClick={() => { updateStatus.mutate('ACTIVE'); setMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Target size={14} className="text-blue-500" /> Reactivar
                      </button>
                    )}
                    <button onClick={() => { updateStatus.mutate('ARCHIVED'); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Archive size={14} className="text-gray-400" /> Archivar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function ObjectivesPage() {
  const [filter, setFilter] = useState<'ACTIVE' | 'COMPLETED' | 'ALL'>('ACTIVE');

  const { data: objectives = [], isLoading } = useQuery<Objective[]>({
    queryKey: ['objectives', filter],
    queryFn: () => objectivesApi.list(filter !== 'ALL' ? filter : undefined).then(r => r.data),
  });

  const activeCount = objectives.filter(o => o.status === 'ACTIVE').length;
  const completedCount = objectives.filter(o => o.status === 'COMPLETED').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Objetivos</h1>
          <p className="text-gray-500 text-sm mt-0.5">{activeCount} activos · {completedCount} completados</p>
        </div>
        <Button as={Link} to="/objetivos/nuevo">
          <Plus size={16} /> Nuevo
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'ACTIVE', label: 'Activos' },
          { key: 'COMPLETED', label: 'Completados' },
          { key: 'ALL', label: 'Todos' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : objectives.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <Target size={28} className="text-indigo-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">
            {filter === 'ACTIVE' ? 'No tenés objetivos activos' : 'No hay objetivos aquí'}
          </h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            {filter === 'ACTIVE'
              ? 'Creá tu primer objetivo y comenzá tu proceso de transformación.'
              : 'Cambiá el filtro para ver tus objetivos.'}
          </p>
          {filter === 'ACTIVE' && (
            <Button as={Link} to="/objetivos/nuevo">
              <Plus size={16} /> Crear objetivo
            </Button>
          )}
        </div>
      ) : (
        <motion.div layout className="flex flex-col gap-3">
          <AnimatePresence>
            {objectives.map((obj) => (
              <ObjectiveCard key={obj.id} objective={obj} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
