import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const NLP_TECHNIQUES: Record<string, { name: string; description: string; steps: { title: string; instruction: string; reflection?: string }[] }> = {
  REFRAMING: {
    name: 'Reencuadre',
    description: 'Cambiar la perspectiva desde la que ves una situación para encontrar nuevos significados y posibilidades.',
    steps: [
      { title: 'Identificá la situación', instruction: 'Describí la situación que te está bloqueando. ¿Qué estás pensando o sintiendo al respecto?', reflection: '¿Cómo la describirías a un amigo?' },
      { title: 'Explorá el opuesto', instruction: 'Ahora pensá: ¿qué pasaría si esto fuera exactamente lo que necesitabas? ¿Qué oportunidad podría estar escondida aquí?', reflection: '¿Qué diría alguien que admiras sobre esta situación?' },
      { title: 'Encontrá el aprendizaje', instruction: 'Si esto fuera una lección perfectamente diseñada para vos, ¿qué estarías aprendiendo?', reflection: '¿Qué te hace más fuerte esta experiencia?' },
      { title: 'El nuevo significado', instruction: 'Con esta nueva perspectiva, ¿cómo ves la situación ahora? Escribí tu nuevo encuadre en pocas palabras.', reflection: '¿Cómo cambia esto tu próximo paso?' },
    ],
  },
  ANCHORING: {
    name: 'Anclaje',
    description: 'Crear un disparador físico que te lleve instantáneamente a un estado emocional de recursos.',
    steps: [
      { title: 'Elegí tu estado de recursos', instruction: 'Pensá en un momento donde te sentiste completamente en tu mejor versión. Confiado, motivado, claro. ¿Cuándo fue eso?', reflection: '¿Qué estabas haciendo? ¿Con quién estabas?' },
      { title: 'Revivilo intensamente', instruction: 'Cerrá los ojos y volvé a ese momento. Ves lo que veías, escuchás lo que escuchabas, sentís lo que sentías. Hacelo lo más real posible.', reflection: '¿Dónde sentís ese estado en tu cuerpo?' },
      { title: 'Creá el ancla', instruction: 'En el pico de esa emoción positiva, presioná firmemente el nudillo de tu dedo índice con el pulgar durante 10 segundos. Ese es tu ancla.', reflection: '¿Qué sensación física percibís?' },
      { title: 'Activá y verificá', instruction: 'Soltá. Pensá en algo neutral. Ahora activá el ancla nuevamente. ¿Volvés al estado? Practicá 3 veces.', reflection: '¿Qué tan fácil fue volver a ese estado?' },
    ],
  },
  SWITCH_PATTERN: {
    name: 'Modelo Switch',
    description: 'Reemplazar automáticamente un pensamiento limitante por uno potenciador.',
    steps: [
      { title: 'La imagen problema', instruction: 'Pensá en el comportamiento o pensamiento que querés cambiar. Creá una imagen mental de él. ¿Qué ves, escuchás, sentís?', reflection: '¿Dónde está esa imagen? ¿Es grande o pequeña?' },
      { title: 'La imagen deseada', instruction: 'Ahora creá una imagen de vos ya habiendo logrado el cambio. Vos en tu mejor versión. Hacela brillante, grande, cercana y atractiva.', reflection: '¿Cómo te ves? ¿Qué estás haciendo?' },
      { title: 'El Switch', instruction: 'Empezá con la imagen problema grande. Luego hacela pequeña y opaca RÁPIDAMENTE mientras la imagen deseada explota en primer plano, brillante y enorme. ¡Di "Switch!" en voz alta.', reflection: '¿Qué sentiste durante el cambio?' },
      { title: 'Repetición', instruction: 'Hacé el switch 5 veces rápidamente. Luego pensá en la imagen problema original... ¿qué ocurre?', reflection: '¿Es más difícil mantener la imagen problema ahora?' },
    ],
  },
  SUBMODALITIES: {
    name: 'Cambio de Submodalidades',
    description: 'Modificar las cualidades internas de tus representaciones mentales para cambiar su impacto emocional.',
    steps: [
      { title: 'Identificá la creencia limitante', instruction: 'Pensá en una creencia que te limita (ej: "No soy capaz"). Creá una imagen mental de esa creencia.', reflection: '¿Qué ves cuando pensás en esa creencia?' },
      { title: 'Explorá sus cualidades', instruction: 'Analizá la imagen: ¿es a color o en blanco y negro? ¿Está cerca o lejos? ¿Es brillante u oscura? ¿Grande o pequeña? ¿Con movimiento?', reflection: '¿Cómo se sienten esas cualidades en tu cuerpo?' },
      { title: 'Transformá las cualidades', instruction: 'Ahora cambiá las submodalidades: hacé la imagen más pequeña, más lejana, apagá los colores. Observá cómo cambia la emoción.', reflection: '¿Qué ocurre con la intensidad de la creencia?' },
      { title: 'Instalá la nueva creencia', instruction: 'Ahora pensá en la creencia opuesta positiva. Hacé su imagen grande, brillante, cercana y colorida. Sentila en tu cuerpo.', reflection: '¿Cómo suena esta nueva creencia?' },
    ],
  },
  PARTS_INTEGRATION: {
    name: 'Integración de Partes',
    description: 'Resolver un conflicto interno entre dos partes que quieren cosas diferentes.',
    steps: [
      { title: 'Identificá las dos partes', instruction: 'Notás algo como "una parte mía quiere X pero otra parte quiere Y"? Describí cada parte. ¿Cuál es su intención positiva?', reflection: '¿Qué intenta protegerte cada parte?' },
      { title: 'Dialogá con cada parte', instruction: 'Imaginá cada parte en una de tus manos. Habla con la primera: ¿qué querés lograr? ¿Para qué? Repite con la segunda parte.', reflection: '¿Cuál es el propósito más profundo de cada una?' },
      { title: 'Encontrá el propósito común', instruction: 'Ambas partes tienen una intención positiva. Seguí subiendo en los niveles de intención hasta encontrar un objetivo que ambas compartan.', reflection: '¿En qué punto se unen las dos partes?' },
      { title: 'La integración', instruction: 'Acercá lentamente tus manos. Cuando se toquen, sentí cómo las dos partes se fusionan en una energía unificada. Lleválas a tu corazón.', reflection: '¿Cómo se siente esta nueva parte integrada?' },
    ],
  },
  LOGICAL_LEVELS: {
    name: 'Niveles Lógicos',
    description: 'Explorar la situación desde diferentes niveles de profundidad: entorno, comportamiento, capacidad, creencias, identidad y misión.',
    steps: [
      { title: 'Entorno', instruction: '¿Cuándo y dónde ocurre la situación? ¿Qué elementos externos influyen en el problema?', reflection: '¿El entorno te está apoyando o limitando?' },
      { title: 'Comportamiento', instruction: '¿Qué estás haciendo o dejando de hacer? ¿Qué acciones concretas están presentes o ausentes?', reflection: '¿Qué comportamientos te gustaría cambiar?' },
      { title: 'Capacidades', instruction: '¿Qué habilidades tenés? ¿Cuáles te faltan? ¿Qué estrategias estás usando?', reflection: '¿Qué nueva capacidad necesitarías desarrollar?' },
      { title: 'Creencias y Valores', instruction: '¿Qué creés sobre vos mismo en relación a este objetivo? ¿Qué valores están en juego?', reflection: '¿Hay creencias que te limitan? ¿Cuáles te potencian?' },
      { title: 'Identidad', instruction: '¿Quién sos en relación a esto? ¿Cómo te definís a vos mismo?', reflection: '¿Quién querés ser al lograr este objetivo?' },
      { title: 'Propósito y Misión', instruction: '¿Para qué existe esto más allá de vos? ¿Cómo conecta con algo más grande?', reflection: '¿Cuál es el impacto que querés generar en el mundo?' },
    ],
  },
  TIMELINE: {
    name: 'Línea del Tiempo',
    description: 'Viajar mentalmente hacia el futuro para ver el objetivo ya logrado y crear recursos desde ese lugar.',
    steps: [
      { title: 'Construí tu línea', instruction: 'Imaginá una línea que representa tu vida. El pasado está detrás tuyo, el futuro adelante. Párate en el presente.', reflection: '¿Cómo se siente estar parado en el hoy?' },
      { title: 'Viajá al futuro', instruction: 'Caminá mentalmente hacia adelante en tu línea hasta llegar al momento en que ya lograste tu objetivo. ¿Cuánto tiempo pasó? ¿Cómo se siente estar ahí?', reflection: '¿Qué ves a tu alrededor? ¿Quién está con vos?' },
      { title: 'Experienciá el logro', instruction: 'Desde ese lugar del futuro, con el objetivo ya alcanzado, viví esa sensación plenamente. ¿Qué ves, escuchás, sentís?', reflection: '¿Qué tiene de especial este momento?' },
      { title: 'Mirá hacia atrás', instruction: 'Desde el futuro, mirate a vos mismo en el presente. ¿Qué consejo te darías? ¿Qué pasos tomaste para llegar aquí?', reflection: '¿Cuál fue el primer paso más importante?' },
      { title: 'Volvé con recursos', instruction: 'Trae todos esos recursos, esa certeza y esa energía de vuelta al presente. ¿Cuál es el primer pequeño paso que vas a dar hoy?', reflection: '¿Qué vas a hacer diferente a partir de ahora?' },
    ],
  },
};

router.get('/techniques', (_req, res: Response) => {
  const techniques = Object.entries(NLP_TECHNIQUES).map(([key, val]) => ({
    key,
    name: val.name,
    description: val.description,
    stepCount: val.steps.length,
  }));
  res.json(techniques);
});

router.get('/techniques/:key', (req, res: Response) => {
  const tech = NLP_TECHNIQUES[req.params.key.toUpperCase()];
  if (!tech) return res.status(404).json({ error: 'Técnica no encontrada' });
  res.json({ key: req.params.key.toUpperCase(), ...tech });
});

router.post('/sessions', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { technique, objectiveId, notes, completed } = req.body;
    const session = await prisma.nlpSession.create({
      data: {
        userId: req.userId!,
        technique,
        objectiveId,
        notes,
        completed: completed ?? false,
      },
    });
    res.status(201).json(session);
  } catch {
    res.status(500).json({ error: 'Error al guardar sesión' });
  }
});

export default router;
