import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Save, Trash2, ChevronRight } from 'lucide-react';
import { objectivesApi, actionsApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import type { Objective, Action } from '../types';

interface ActionForm {
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: string;
  energyLevel: string;
  priority: string;
  category: string;
  notes: string;
}

const DEFAULT_FORM: ActionForm = {
  title: '',
  description: '',
  estimatedTime: '',
  difficulty: 'EASY',
  energyLevel: 'LOW',
  priority: 'MEDIUM',
  category: '',
  notes: '',
};

function SelectField({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function ActionsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ActionForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  const { data: objective } = useQuery<Objective>({
    queryKey: ['objective', id],
    queryFn: () => objectivesApi.get(id!).then(r => r.data),
  });

  const createAction = useMutation({
    mutationFn: (data: Record<string, unknown>) => actionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective', id] });
      setForm(DEFAULT_FORM);
      setShowForm(false);
    },
  });

  const deleteAction = useMutation({
    mutationFn: (actionId: string) => actionsApi.delete(actionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['objective', id] }),
  });

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await createAction.mutateAsync({
        objectiveId: id!,
        title: form.title,
        description: form.description || undefined,
        estimatedTime: form.estimatedTime ? parseInt(form.estimatedTime) : undefined,
        difficulty: form.difficulty,
        energyLevel: form.energyLevel,
        priority: form.priority,
        category: form.category || undefined,
        notes: form.notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const actions = objective?.actions ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/objetivos/${id}`)} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900">Plan de Acción</h1>
          <p className="text-sm text-gray-500 line-clamp-1">{objective?.title}</p>
        </div>
        <Button onClick={() => navigate(`/objetivos/${id}`)} variant="ghost" size="sm">
          Ver objetivo <ChevronRight size={14} />
        </Button>
      </div>

      {/* Tip */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <p className="text-sm font-medium text-amber-800 mb-1">💡 Filosofía del micro-avance</p>
        <p className="text-sm text-amber-700">
          Las acciones deben ser tan pequeñas que sea casi imposible no hacerlas.
          Mejor 10 minutos de algo que 0 minutos de perfección.
        </p>
      </div>

      {/* Actions list */}
      {actions.length > 0 && (
        <div className="flex flex-col gap-2">
          {actions.map((action: Action) => (
            <motion.div
              key={action.id}
              layout
              className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{action.title}</p>
                <div className="flex gap-2 mt-1">
                  {action.estimatedTime && (
                    <span className="text-xs text-gray-400">{action.estimatedTime} min</span>
                  )}
                  <span className="text-xs text-gray-400 capitalize">{action.difficulty.toLowerCase()}</span>
                </div>
              </div>
              <button
                onClick={() => deleteAction.mutate(action.id)}
                className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showForm ? (
        <Card>
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-gray-900">Nueva acción</h3>
            <Input
              label="¿Qué vas a hacer? *"
              placeholder="Ej: Buscar 3 videos de YouTube sobre..."
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <Textarea
              label="Descripción (opcional)"
              rows={2}
              placeholder="Más detalles sobre esta acción..."
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Tiempo estimado (min)"
                type="number"
                placeholder="15"
                value={form.estimatedTime}
                onChange={(e) => setForm(f => ({ ...f, estimatedTime: e.target.value }))}
              />
              <Input
                label="Categoría"
                placeholder="Ej: Estudio"
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SelectField
                label="Dificultad"
                value={form.difficulty}
                onChange={(v) => setForm(f => ({ ...f, difficulty: v }))}
                options={[
                  { value: 'EASY', label: 'Fácil' },
                  { value: 'MEDIUM', label: 'Media' },
                  { value: 'HARD', label: 'Difícil' },
                  { value: 'VERY_HARD', label: 'Muy difícil' },
                ]}
              />
              <SelectField
                label="Energía"
                value={form.energyLevel}
                onChange={(v) => setForm(f => ({ ...f, energyLevel: v }))}
                options={[
                  { value: 'LOW', label: 'Baja' },
                  { value: 'MEDIUM', label: 'Media' },
                  { value: 'HIGH', label: 'Alta' },
                ]}
              />
              <SelectField
                label="Prioridad"
                value={form.priority}
                onChange={(v) => setForm(f => ({ ...f, priority: v }))}
                options={[
                  { value: 'LOW', label: 'Baja' },
                  { value: 'MEDIUM', label: 'Media' },
                  { value: 'HIGH', label: 'Alta' },
                  { value: 'URGENT', label: 'Urgente' },
                ]}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} loading={saving} disabled={!form.title.trim()}>
                <Save size={14} /> Guardar acción
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); }}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          size="lg"
          className="w-full border-dashed"
        >
          <Plus size={16} /> Agregar acción
        </Button>
      )}

      {actions.length > 0 && (
        <Button size="lg" onClick={() => navigate(`/objetivos/${id}`)}>
          Ver mi objetivo <ChevronRight size={16} />
        </Button>
      )}
    </div>
  );
}
