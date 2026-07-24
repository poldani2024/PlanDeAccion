import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { createNlpSession } from '../lib/firestore';
import { useAuthStore } from '../store/auth';
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

const TECHNIQUES: NlpTechniqueInfo[] = [
  {
    key: 'REFRAMING',
    name: 'Reencuadre',
    description: 'Cambiá la perspectiva con la que ves una situación para encontrar nuevos significados y posibilidades.',
    stepCount: 5,
    steps: [
      { title: 'Identificá la situación', instruction: 'Pensá en una situación que te genera malestar o bloqueo. Describila con detalle.', reflection: '¿Qué situación querés reencuadrar?' },
      { title: 'Explorá el contexto', instruction: '¿En qué contexto esta situación podría ser útil o tener un lado positivo?', reflection: '¿Qué aspectos positivos podría tener esta situación en otro contexto?' },
      { title: 'Buscá la intención positiva', instruction: '¿Qué parte de vos está tratando de protegerte o ayudarte con esta situación?', reflection: '¿Cuál es la intención positiva detrás de este comportamiento o creencia?' },
      { title: 'Generá alternativas', instruction: 'Pensá en al menos 3 formas diferentes de ver esta misma situación.', reflection: '¿Qué otras interpretaciones son posibles?' },
      { title: 'Elegí el nuevo encuadre', instruction: 'Seleccioná la perspectiva que te resulte más útil y empoderantne.', reflection: '¿Cuál es la nueva interpretación que querés adoptar?' },
    ],
  },
  {
    key: 'ANCHORING',
    name: 'Anclaje',
    description: 'Asociá un estado interno positivo a un estímulo físico para acceder a él cuando lo necesitás.',
    stepCount: 5,
    steps: [
      { title: 'Elegí el estado que querés anclar', instruction: 'Pensá en un estado emocional que quieras tener disponible: confianza, calma, energía, enfoque...', reflection: '¿Qué estado emocional querés anclar?' },
      { title: 'Recordá cuando lo viviste', instruction: 'Traé a tu mente un momento en que experimentaste ese estado con intensidad. Viví ese recuerdo vívidamente.', reflection: '¿En qué momento lo sentiste con más fuerza?' },
      { title: 'Intensificá la experiencia', instruction: 'Mientras revivís ese momento, amplificá las imágenes, sonidos y sensaciones. ¿Qué ves, escuchás y sentís?', reflection: 'Describi el recuerdo en detalle sensorial.' },
      { title: 'Establecé el ancla', instruction: 'En el pico de la emoción, aplicá un estímulo físico único: apretá dos dedos, tocá tu muñeca, una postura específica.', reflection: '¿Qué estímulo físico elegiste para tu ancla?' },
      { title: 'Probá el ancla', instruction: 'Interrumpí el estado, pensá en algo neutro. Ahora activá tu ancla. ¿Qué sensaciones te genera?', reflection: '¿Qué ocurre cuando activás el ancla?' },
    ],
  },
  {
    key: 'SWITCH_PATTERN',
    name: 'Switch Pattern',
    description: 'Reemplazá un patrón mental limitante por uno que te impulse hacia tus objetivos.',
    stepCount: 4,
    steps: [
      { title: 'Identificá el patrón actual', instruction: '¿Cuál es la imagen mental o pensamiento que aparece justo antes de caer en el comportamiento que querés cambiar?', reflection: '¿Qué imagen o pensamiento dispara el patrón que querés cambiar?' },
      { title: 'Creá la imagen deseada', instruction: 'Creá una imagen vívida de vos mismo con el nuevo comportamiento o estado. ¿Cómo te ves, sentís y escuchás?', reflection: '¿Cómo es la imagen de la versión de vos que ya logró el cambio?' },
      { title: 'Hacé el switch', instruction: 'Visualizá la imagen del patrón actual, grande y clara. Luego, rápidamente, hacé que explote y sea reemplazada por la imagen deseada. Repetí 5 veces.', reflection: '¿Cómo se sintió el proceso de cambio?' },
      { title: 'Verificá el resultado', instruction: 'Intentá volver a pensar en la situación original. ¿Qué ocurre ahora? ¿La imagen cambió?', reflection: '¿Qué diferencia notás en cómo experimentás la situación ahora?' },
    ],
  },
  {
    key: 'SUBMODALITIES',
    name: 'Submodalidades',
    description: 'Modificá las cualidades sensoriales de tus representaciones mentales para cambiar su impacto emocional.',
    stepCount: 5,
    steps: [
      { title: 'Elegí una creencia o recuerdo', instruction: 'Pensá en una creencia limitante o un recuerdo que te genere malestar que quieras trabajar.', reflection: '¿Qué creencia o recuerdo querés transformar?' },
      { title: 'Explorá las submodalidades visuales', instruction: '¿Es una imagen? ¿Está en color o blanco y negro? ¿Es grande o pequeña? ¿Está cerca o lejos? ¿Tiene movimiento?', reflection: 'Describi las características visuales de la imagen mental.' },
      { title: 'Explorá las submodalidades auditivas y kinestésicas', instruction: '¿Hay sonidos o voces? ¿Son fuertes o suaves? ¿Hay sensaciones en el cuerpo? ¿Dónde las sentís?', reflection: 'Describi las características auditivas y corporales.' },
      { title: 'Modificá las submodalidades', instruction: 'Hacé la imagen más pequeña, más lejana, en blanco y negro. Bajá el volumen. ¿Cómo cambia la emoción?', reflection: '¿Qué cambios de submodalidades producen mayor alivio?' },
      { title: 'Instalá el nuevo estado', instruction: 'Ahora creá una imagen del estado deseado con submodalidades poderosas: grande, brillante, colorida, cercana. ¿Cómo te sentís?', reflection: '¿Cómo se siente la nueva representación?' },
    ],
  },
  {
    key: 'PARTS_INTEGRATION',
    name: 'Integración de Partes',
    description: 'Reconciliá partes conflictivas de tu personalidad para recuperar energía y coherencia interna.',
    stepCount: 5,
    steps: [
      { title: 'Identificá el conflicto', instruction: '¿Sientes que una parte de vos quiere algo y otra parte quiere otra cosa? Describí el conflicto.', reflection: '¿Cuál es el conflicto interno que estás experimentando?' },
      { title: 'Conocé la primera parte', instruction: 'Imaginate la primera parte en tu mano dominante. ¿Cómo es? ¿Qué forma tiene? ¿Qué dice? ¿Qué quiere?', reflection: 'Describi la primera parte y su intención positiva.' },
      { title: 'Conocé la segunda parte', instruction: 'Imaginate la segunda parte en tu otra mano. ¿Cómo es? ¿Qué forma tiene? ¿Qué dice? ¿Qué quiere en el fondo?', reflection: 'Describi la segunda parte y su intención positiva.' },
      { title: 'Encontrá el objetivo común', instruction: '¿En qué están de acuerdo ambas partes? ¿Cuál es el objetivo más profundo que comparten?', reflection: '¿Cuál es el objetivo común de ambas partes?' },
      { title: 'Integrá las partes', instruction: 'Lentamente acercá las manos hasta juntarlas, sintiendo cómo las partes se fusionan. Llevá esa energía integrada al centro de tu pecho.', reflection: '¿Cómo se siente la integración? ¿Qué cambia?' },
    ],
  },
  {
    key: 'LOGICAL_LEVELS',
    name: 'Niveles Lógicos',
    description: 'Analizá el cambio en los diferentes niveles neurológicos: entorno, comportamiento, capacidades, creencias, identidad y propósito.',
    stepCount: 6,
    steps: [
      { title: 'Entorno', instruction: '¿Dónde y cuándo ocurre la situación que querés cambiar? ¿Qué hay en tu entorno que facilita o dificulta el cambio?', reflection: '¿Qué condiciones de tu entorno influyen en esta situación?' },
      { title: 'Comportamiento', instruction: '¿Qué hacés específicamente? ¿Qué comportamientos concretos querés cambiar o desarrollar?', reflection: '¿Qué hacés y qué querés hacer diferente?' },
      { title: 'Capacidades', instruction: '¿Qué habilidades tenés disponibles? ¿Qué nuevas capacidades necesitás desarrollar para lograr el cambio?', reflection: '¿Qué capacidades te faltan para el cambio?' },
      { title: 'Creencias y valores', instruction: '¿Qué creés sobre vos mismo y sobre el mundo? ¿Qué valores están en juego? ¿Qué creencias te limitan?', reflection: '¿Qué creencias o valores están detrás de esta situación?' },
      { title: 'Identidad', instruction: '¿Quién sos vos? ¿Cómo te definís? ¿Cómo el cambio que buscás se relaciona con quién querés ser?', reflection: '¿Cómo este cambio se conecta con tu identidad?' },
      { title: 'Propósito y conexión', instruction: '¿Para qué? ¿Cuál es el propósito mayor detrás de este cambio? ¿Cómo conecta con algo más grande que vos?', reflection: '¿Cuál es el propósito más elevado de este cambio?' },
    ],
  },
  {
    key: 'TIMELINE',
    name: 'Línea del Tiempo',
    description: 'Viajá mentalmente por tu línea del tiempo para sanar el pasado y construir un futuro poderoso.',
    stepCount: 5,
    steps: [
      { title: 'Visualizá tu línea del tiempo', instruction: 'Imaginá tu línea del tiempo como una línea en el espacio. ¿El pasado está detrás tuyo? ¿Delante? ¿A tu izquierda? Observala.', reflection: '¿Cómo percibís tu línea del tiempo?' },
      { title: 'Revisitá el pasado', instruction: 'Flotá sobre tu línea del tiempo hacia el pasado. Encontrá un evento que ya superaste y que te dio fortaleza. ¿Qué recurso encontrás ahí?', reflection: '¿Qué fortaleza o aprendizaje encontrás en tu pasado?' },
      { title: 'Anclate en el presente', instruction: 'Regresá al presente. ¿Qué recursos del pasado traés con vos? ¿Qué te dice tu yo presente que necesita?', reflection: '¿Qué recursos del pasado traés al presente?' },
      { title: 'Construí el futuro', instruction: 'Flotá hacia el futuro donde ya lograste tu objetivo. ¿Qué ves, escuchás y sentís? Describí ese momento vívidamente.', reflection: '¿Cómo es ese futuro donde ya lograste tu objetivo?' },
      { title: 'Activá el camino', instruction: 'Desde ese futuro, mirá hacia atrás al presente. ¿Qué pasos tomaste para llegar ahí? ¿Qué consejo te da tu yo futuro?', reflection: '¿Qué mensaje te da tu yo futuro?' },
    ],
  },
];

function TechniqueSession({ technique, onBack }: { technique: NlpTechniqueInfo; onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState<string[]>(technique.steps?.map(() => '') ?? []);
  const [completed, setCompleted] = useState(false);
  const { user } = useAuthStore();

  const saveSession = useMutation({
    mutationFn: () => createNlpSession(user!.id, { technique: technique.key, notes: notes.join('\n---\n'), completed: true }),
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
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-5"
        >
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{currentStep.title}</h2>
            <p className="text-gray-600 leading-relaxed">{currentStep.instruction}</p>
          </div>

          {currentStep.reflection && (
            <Textarea
              label={currentStep.reflection}
              rows={4}
              placeholder="Escribí tu respuesta aquí..."
              value={notes[step]}
              onChange={(e) => setNotes(n => { const copy = [...n]; copy[step] = e.target.value; return copy; })}
            />
          )}

          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft size={16} /> Anterior
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button className="flex-1" onClick={() => setStep(s => s + 1)}>
                Continuar <ChevronRight size={16} />
              </Button>
            ) : (
              <Button className="flex-1" loading={saveSession.isPending} onClick={() => saveSession.mutate()}>
                <Check size={16} /> Completar sesión
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function NlpPage() {
  const [selected, setSelected] = useState<NlpTechniqueInfo | null>(null);

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

      <div className="grid sm:grid-cols-2 gap-3">
        {TECHNIQUES.map((tech) => (
          <motion.div key={tech.key} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Card
              hover
              onClick={() => setSelected(tech)}
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
    </div>
  );
}
