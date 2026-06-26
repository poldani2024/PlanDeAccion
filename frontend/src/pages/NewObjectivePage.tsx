import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Plus, X } from 'lucide-react';
import { objectivesApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { useQueryClient } from '@tanstack/react-query';

interface StepData {
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
}

const STEPS = [
  {
    id: 1,
    question: '¿Qué querés lograr?',
    subtitle: 'Describí tu objetivo de forma clara y concreta.',
    field: 'title',
    type: 'textarea',
    placeholder: 'Por ejemplo: Aprender a tocar la guitarra y tocar mi primera canción en 3 meses.',
    hint: 'Sé específico. Cuanto más claro sea tu objetivo, más fácil será alcanzarlo.',
  },
  {
    id: 2,
    question: '¿Para qué querés lograrlo?',
    subtitle: 'La intención positiva detrás de tu objetivo.',
    field: 'positiveIntention',
    type: 'textarea',
    placeholder: 'Por ejemplo: Quiero conectar más con mi familia a través de la música.',
    hint: 'Esto es el motor que te va a mantener en movimiento cuando las cosas se pongan difíciles.',
  },
  {
    id: 3,
    question: '¿Por qué es importante para vos?',
    subtitle: 'Los valores que están en juego.',
    field: 'values',
    type: 'tags',
    placeholder: 'Escribí un valor y presioná Enter',
    hint: 'Por ejemplo: creatividad, conexión, superación, libertad, salud...',
  },
  {
    id: 4,
    question: '¿Cómo vas a saber que lo lograste?',
    subtitle: 'Las evidencias concretas de tu éxito.',
    field: 'evidence',
    type: 'textarea',
    placeholder: 'Por ejemplo: Cuando pueda tocar 3 canciones completas sin mirar las notas.',
    hint: 'Pensá en qué vas a ver, escuchar o sentir cuando hayas alcanzado tu objetivo.',
  },
  {
    id: 5,
    question: '¿Dónde estás hoy?',
    subtitle: 'Tu punto de partida actual.',
    field: 'currentState',
    type: 'textarea',
    placeholder: 'Por ejemplo: Nunca tomé clases de guitarra. Sé leer música básica.',
    hint: 'Ser honesto sobre tu situación actual es el primer paso para avanzar.',
  },
  {
    id: 6,
    question: '¿Qué recursos ya tenés?',
    subtitle: 'Habilidades, conocimientos, contactos o herramientas que ya tenés.',
    field: 'availableResources',
    type: 'tags',
    placeholder: 'Escribí un recurso y presioná Enter',
    hint: 'Por ejemplo: tengo una guitarra, tengo tiempo los fines de semana, ya sé solfeo...',
  },
  {
    id: 7,
    question: '¿Qué recursos necesitás conseguir?',
    subtitle: 'Lo que todavía necesitás para lograrlo.',
    field: 'neededResources',
    type: 'tags',
    placeholder: 'Escribí un recurso y presioná Enter',
    hint: 'Por ejemplo: profesor, método de estudio, una guitarra nueva...',
  },
  {
    id: 8,
    question: '¿Qué obstáculos podrían aparecer?',
    subtitle: 'Anticipar los desafíos te ayuda a estar preparado.',
    field: 'obstacles',
    type: 'tags',
    placeholder: 'Escribí un obstáculo y presioná Enter',
    hint: 'Por ejemplo: falta de tiempo, frustración al principio, callos en los dedos...',
  },
  {
    id: 9,
    question: '¿Qué consecuencias podría generar?',
    subtitle: 'Tanto positivas como negativas. Esto se llama ecología del objetivo.',
    field: null,
    type: 'ecology',
    placeholder: '',
    hint: 'Pensar en el impacto completo te ayuda a comprometerte con mayor consciencia.',
  },
];

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput('');
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter(t => t !== tag));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <Button onClick={addTag} variant="secondary" size="md" type="button">
          <Plus size={16} />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm">
              {tag}
              <button onClick={() => removeTag(tag)} className="text-indigo-400 hover:text-indigo-600">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewObjectivePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StepData>({
    title: '',
    positiveIntention: '',
    values: [],
    evidence: '',
    currentState: '',
    availableResources: [],
    neededResources: [],
    obstacles: [],
    positiveConsequences: [],
    negativeConsequences: [],
  });

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  function updateField(field: keyof StepData, value: string | string[]) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  function canAdvance() {
    if (currentStep.field === 'title' && !data.title.trim()) return false;
    return true;
  }

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      await handleSubmit();
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await objectivesApi.create(data as unknown as Record<string, unknown>);
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate(`/objetivos/${res.data.id}/acciones`);
    } catch {
      setLoading(false);
    }
  }

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/objetivos')}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={20} className="text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500">Paso {step + 1} de {STEPS.length}</span>
            <span className="text-xs font-medium text-gray-500">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-600 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="flex flex-col gap-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStep.question}</h2>
            <p className="text-gray-500">{currentStep.subtitle}</p>
          </div>

          {currentStep.type === 'textarea' && currentStep.field && (
            <Textarea
              rows={4}
              placeholder={currentStep.placeholder}
              value={data[currentStep.field as keyof StepData] as string}
              onChange={(e) => updateField(currentStep.field as keyof StepData, e.target.value)}
              className="text-base"
            />
          )}

          {currentStep.type === 'tags' && currentStep.field && (
            <TagInput
              value={data[currentStep.field as keyof StepData] as string[]}
              onChange={(v) => updateField(currentStep.field as keyof StepData, v)}
              placeholder={currentStep.placeholder}
            />
          )}

          {currentStep.type === 'ecology' && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-2">✅ Consecuencias positivas</p>
                <TagInput
                  value={data.positiveConsequences}
                  onChange={(v) => updateField('positiveConsequences', v)}
                  placeholder="Ej: Más confianza, nuevas amistades..."
                />
              </div>
              <div>
                <p className="text-sm font-medium text-red-600 mb-2">⚠️ Consecuencias negativas</p>
                <TagInput
                  value={data.negativeConsequences}
                  onChange={(v) => updateField('negativeConsequences', v)}
                  placeholder="Ej: Menos tiempo libre, inversión económica..."
                />
              </div>
            </div>
          )}

          {currentStep.hint && (
            <p className="text-sm text-gray-400 italic">{currentStep.hint}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleNext}
              size="lg"
              loading={loading}
              disabled={!canAdvance()}
              className="flex-1"
            >
              {step === STEPS.length - 1 ? (
                <>Crear objetivo <Check size={16} /></>
              ) : (
                <>Continuar <ChevronRight size={16} /></>
              )}
            </Button>
            {!canAdvance() && step > 0 && (
              <Button variant="ghost" size="lg" onClick={handleNext}>
                Omitir
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
