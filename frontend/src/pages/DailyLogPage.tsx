import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, AlertCircle } from 'lucide-react';
import { objectivesApi, dailyLogsApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { Slider } from '../components/ui/Slider';
import { BLOCKER_LABELS } from '../lib/utils';
import type { Objective, BlockerType } from '../types';

interface LogData {
  emotionBefore: number;
  motivationLevel: number;
  energyLevel: number;
  completedActionIds: string[];
  emotionAfter: number;
  timeInvested: string;
  comments: string;
  learnings: string;
  hadBlocker: boolean;
  blockerType: BlockerType | '';
  blockerNote: string;
}

const STEPS = [
  'check-in',
  'acciones',
  'check-out',
  'blocker',
  'done',
];

export default function DailyLogPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<LogData>({
    emotionBefore: 5,
    motivationLevel: 5,
    energyLevel: 5,
    completedActionIds: [],
    emotionAfter: 5,
    timeInvested: '',
    comments: '',
    learnings: '',
    hadBlocker: false,
    blockerType: '',
    blockerNote: '',
  });

  const { data: objective } = useQuery<Objective>({
    queryKey: ['objective', id],
    queryFn: () => objectivesApi.get(id!).then(r => r.data),
  });

  const saveLog = useMutation({
    mutationFn: (logData: Record<string, unknown>) => dailyLogsApi.create(logData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setStep(STEPS.length - 1);
    },
  });

  const pendingActions = objective?.actions?.filter(a => a.status !== 'COMPLETED') ?? [];
  function toggleAction(actionId: string) {
    setData(d => ({
      ...d,
      completedActionIds: d.completedActionIds.includes(actionId)
        ? d.completedActionIds.filter(id => id !== actionId)
        : [...d.completedActionIds, actionId],
    }));
  }

  async function handleSave() {
    const today = new Date().toISOString().split('T')[0];
    await saveLog.mutateAsync({
      objectiveId: id!,
      date: today,
      emotionBefore: data.emotionBefore,
      emotionAfter: data.emotionAfter,
      motivationLevel: data.motivationLevel,
      energyLevel: data.energyLevel,
      timeInvested: data.timeInvested ? parseInt(data.timeInvested) : undefined,
      comments: data.comments || undefined,
      learnings: data.learnings || undefined,
      blockerType: data.hadBlocker && data.blockerType ? data.blockerType : undefined,
      blockerNote: data.hadBlocker && data.blockerNote ? data.blockerNote : undefined,
      actionLogs: [
        ...data.completedActionIds.map(actionId => ({ actionId, completed: true })),
        ...pendingActions
          .filter(a => !data.completedActionIds.includes(a.id))
          .map(a => ({ actionId: a.id, completed: false })),
      ],
    });
  }

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  if (step === STEPS.length - 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Excelente trabajo!</h2>
          <p className="text-gray-500 mb-8">Registraste tu actividad de hoy. Cada día cuenta.</p>
          <Button size="lg" onClick={() => navigate(`/objetivos/${id}`)}>
            Ver mi objetivo
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate(`/objetivos/${id}`)}
          className="p-2 rounded-xl hover:bg-gray-100"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <p className="text-sm text-gray-500">Registro diario</p>
          <div className="flex gap-1 mt-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-6"
        >
          {/* Step 0: Check-in */}
          {step === 0 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">¿Cómo llegás a este momento?</h2>
                <p className="text-gray-500 text-sm">Antes de empezar, tomate un segundo para conectarte con vos.</p>
              </div>
              <Slider
                label="Estado emocional"
                value={data.emotionBefore}
                onChange={(v) => setData(d => ({ ...d, emotionBefore: v }))}
                emoji
              />
              <Slider
                label="Nivel de motivación"
                value={data.motivationLevel}
                onChange={(v) => setData(d => ({ ...d, motivationLevel: v }))}
              />
              <Slider
                label="Nivel de energía"
                value={data.energyLevel}
                onChange={(v) => setData(d => ({ ...d, energyLevel: v }))}
              />
              <Button size="lg" onClick={() => setStep(1)}>
                Continuar <ChevronRight size={16} />
              </Button>
            </>
          )}

          {/* Step 1: Actions */}
          {step === 1 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">¿Qué hiciste hoy?</h2>
                <p className="text-gray-500 text-sm">Marcá las acciones que completaste.</p>
              </div>
              {pendingActions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No hay acciones pendientes 🎉</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendingActions.map((action) => {
                    const checked = data.completedActionIds.includes(action.id);
                    return (
                      <button
                        key={action.id}
                        onClick={() => toggleAction(action.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          checked ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          checked ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                        }`}>
                          {checked && <Check size={11} className="text-white" />}
                        </div>
                        <span className={`text-sm ${checked ? 'text-emerald-800 font-medium' : 'text-gray-700'}`}>
                          {action.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Tiempo invertido (minutos)
                </label>
                <input
                  type="number"
                  placeholder="Ej: 45"
                  value={data.timeInvested}
                  onChange={(e) => setData(d => ({ ...d, timeInvested: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button size="lg" className="flex-1" onClick={() => setStep(2)}>
                  {data.completedActionIds.length === 0 ? 'No hice nada hoy' : `Completé ${data.completedActionIds.length} acción${data.completedActionIds.length > 1 ? 'es' : ''}`}
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Check-out */}
          {step === 2 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">¿Cómo terminás el día?</h2>
                <p className="text-gray-500 text-sm">Reflexioná sobre tu experiencia.</p>
              </div>
              <Slider
                label="Estado emocional ahora"
                value={data.emotionAfter}
                onChange={(v) => setData(d => ({ ...d, emotionAfter: v }))}
                emoji
              />
              <Textarea
                label="Comentarios (opcional)"
                rows={2}
                placeholder="¿Cómo te fue? ¿Qué pasó?"
                value={data.comments}
                onChange={(e) => setData(d => ({ ...d, comments: e.target.value }))}
              />
              <Textarea
                label="Aprendizajes (opcional)"
                rows={2}
                placeholder="¿Qué aprendiste hoy?"
                value={data.learnings}
                onChange={(e) => setData(d => ({ ...d, learnings: e.target.value }))}
              />

              {data.completedActionIds.length === 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">¿Qué te bloqueó hoy?</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="secondary" onClick={() => { setData(d => ({ ...d, hadBlocker: true })); handleSave(); }}>
                        Contarme
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleSave} disabled={saveLog.isPending}>
                        Solo guardar
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Button size="lg" onClick={handleSave} loading={saveLog.isPending}>
                <Check size={16} /> Guardar registro
              </Button>
            </>
          )}

          {/* Step 3: Blocker */}
          {step === 3 && (
            <>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">¿Qué ocurrió?</h2>
                <p className="text-gray-500 text-sm">Entender los bloqueos es parte del proceso.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(BLOCKER_LABELS) as [BlockerType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setData(d => ({ ...d, blockerType: key }))}
                    className={`p-3 rounded-xl border text-sm text-left transition-all ${
                      data.blockerType === key
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 font-medium'
                        : 'border-gray-100 bg-white hover:border-gray-200 text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {data.blockerType && (
                <Textarea
                  label="¿Querés agregar algo más?"
                  rows={2}
                  placeholder="Describí qué pasó..."
                  value={data.blockerNote}
                  onChange={(e) => setData(d => ({ ...d, blockerNote: e.target.value }))}
                />
              )}
              <Button size="lg" onClick={handleSave} loading={saveLog.isPending} disabled={!data.blockerType}>
                <Check size={16} /> Guardar
              </Button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
