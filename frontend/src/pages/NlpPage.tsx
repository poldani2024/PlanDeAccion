import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { nlpApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Textarea } from '../components/ui/Input';
import type { NlpTechniqueInfo } from '../types';

const TECHNIQUE_COLORS: Record<string, string> = {
  REFRAMING: 'from-blue-500 to-indigo-600',
  ANCHORING: 'from-amber-500 to-orange-600',
  SWITCH_PATTERN: 'from-violet-500 to-purple-600',
  SUBMODALITIES: 'from-rose-500 to-pink-600',
  PARTS_INTEGRATION: 'from-emerald-500 to-teal-600',
  LOGICAL_LEVELS: 'from-cyan-500 to-sky-600',
  TIMELINE: 'from-indigo-500 to-blue-600',
};

const TECHNIQUE_EMOJIS: Record<string, string> = {
  REFRAMING: '🔄',
  ANCHORING: '⚓',
  SWITCH_PATTERN: '⚡',
  SUBMODALITIES: '🎨',
  PARTS_INTEGRATION: '🤝',
  LOGICAL_LEVELS: '🏔️',
  TIMELINE: '⏳',
};

function TechniqueSession({ technique, onBack }: { technique: NlpTechniqueInfo; onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState<string[]>(technique.steps?.map(() => '') ?? []);
  const [completed, setCompleted] = useState(false);

  const saveSession = useMutation({
    mutationFn: () => nlpApi.createSession({ technique: technique.key, notes: notes.join('\n---\n'), completed: true }),
    onSuccess: () => setCompleted(true),
  });

  const steps = technique.steps ?? [];
  const currentStep = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Sesión completada!</h2>
          <p className="text-gray-500 mb-6">Tomás un momento para integrar lo que viviste.</p>
          <Button onClick={onBack} variant="secondary">Volver a las técnicas</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">{technique.name}</p>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
            <motion.div className="h-full bg-indigo-600 rounded-full" animate={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-xs text-gray-400">{step + 1}/{steps.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex flex-col gap-4"
        >
          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-5">
            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">
              Paso {step + 1}: {currentStep.title}
            </p>
            <p className="text-gray-800 leading-relaxed">{currentStep.instruction}</p>
            {currentStep.reflection && (
              <p className="text-sm text-indigo-600 mt-3 italic">💭 {currentStep.reflection}</p>
            )}
          </div>

          <Textarea
            label="Tu reflexión (opcional)"
            rows={3}
            placeholder="Escribí lo que sentís, pensás o descubrís..."
            value={notes[step]}
            onChange={(e) => {
              const updated = [...notes];
              updated[step] = e.target.value;
              setNotes(updated);
            }}
          />

          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="secondary" size="lg" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft size={16} /> Anterior
              </Button>
            )}
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                if (step < steps.length - 1) setStep(s => s + 1);
                else saveSession.mutate();
              }}
              loading={saveSession.isPending}
            >
              {step < steps.length - 1 ? (
                <> Siguiente <ChevronRight size={16} /></>
              ) : (
                <> Completar <Check size={16} /></>
              )}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function NlpPage() {
  const [selected, setSelected] = useState<NlpTechniqueInfo | null>(null);

  const { data: techniques = [], isLoading } = useQuery<NlpTechniqueInfo[]>({
    queryKey: ['nlp-techniques'],
    queryFn: () => nlpApi.techniques().then(r => r.data),
  });

  const openTechnique = useMutation({
    mutationFn: (key: string) => nlpApi.technique(key).then(r => r.data),
    onSuccess: (data) => setSelected(data),
  });

  if (selected) {
    return <TechniqueSession technique={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain size={20} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Técnicas PNL</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Herramientas para desbloquear, reencuadrar y potenciar tu proceso de cambio.
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Sparkles size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-800">¿Cuándo usarlas?</p>
            <p className="text-sm text-indigo-700 mt-0.5">
              Cuando te sentís bloqueado, sin motivación, con miedos o conflictos internos.
              Cada técnica es un ejercicio guiado de transformación personal.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {techniques.map((tech) => (
            <motion.div key={tech.key} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Card
                hover
                onClick={() => openTechnique.mutate(tech.key)}
                className="cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${TECHNIQUE_COLORS[tech.key] ?? 'from-gray-400 to-gray-600'} flex items-center justify-center text-xl mb-3`}>
                  {TECHNIQUE_EMOJIS[tech.key]}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{tech.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{tech.description}</p>
                <p className="text-xs text-gray-400 mt-2">{tech.stepCount} pasos</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
