import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed achievements
  const achievements = [
    { key: 'FIRST_OBJECTIVE', name: 'Primer Paso', description: 'Creaste tu primer objetivo', icon: '🎯', category: 'milestone' },
    { key: 'FIRST_ACTION_COMPLETED', name: 'En Movimiento', description: 'Completaste tu primera acción', icon: '✅', category: 'action' },
    { key: 'STREAK_3', name: 'Constancia', description: '3 días consecutivos de registro', icon: '🔥', category: 'streak' },
    { key: 'STREAK_7', name: 'Una Semana', description: '7 días consecutivos de registro', icon: '⚡', category: 'streak' },
    { key: 'STREAK_30', name: 'Un Mes', description: '30 días consecutivos de registro', icon: '💎', category: 'streak' },
    { key: 'FIRST_REVIEW', name: 'Reflexión', description: 'Completaste tu primera revisión semanal', icon: '🔍', category: 'review' },
    { key: 'OBJECTIVE_COMPLETED', name: 'Logrado', description: 'Completaste un objetivo', icon: '🏆', category: 'milestone' },
    { key: 'NLP_SESSION', name: 'Explorador', description: 'Realizaste una técnica de PNL', icon: '🧠', category: 'nlp' },
    { key: 'TEN_ACTIONS', name: 'Productivo', description: 'Completaste 10 acciones', icon: '🚀', category: 'action' },
    { key: 'EARLY_BIRD', name: 'Madrugador', description: 'Registraste actividad antes de las 8am', icon: '🌅', category: 'special' },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement,
    });
  }

  // Demo user
  const passwordHash = await bcrypt.hash('demo1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@plandeaccion.app' },
    update: {},
    create: {
      email: 'demo@plandeaccion.app',
      name: 'Usuario Demo',
      passwordHash,
      settings: { create: {} },
    },
  });

  // Demo objective
  const objective = await prisma.objective.upsert({
    where: { id: 'demo-objective-1' },
    update: {},
    create: {
      id: 'demo-objective-1',
      userId: user.id,
      title: 'Aprender a meditar diariamente',
      positiveIntention: 'Quiero sentirme más tranquilo y centrado en el día a día',
      values: ['paz interior', 'salud mental', 'presencia'],
      evidence: 'Meditar 10 minutos cada mañana sin saltear ningún día durante 30 días',
      currentState: 'Intento meditar pero me olvido o me distraigo fácilmente',
      availableResources: ['app de meditación instalada', 'tiempo libre por la mañana'],
      neededResources: ['rutina establecida', 'espacio tranquilo'],
      obstacles: ['distracciones del celular', 'falta de hábito'],
      positiveConsequences: ['mayor claridad mental', 'mejor manejo del estrés'],
      negativeConsequences: ['menos tiempo para otras actividades matutinas'],
    },
  });

  // Demo actions
  const actions = [
    { title: 'Descargar app de meditación guiada', description: 'Buscar y descargar Insight Timer o Headspace', estimatedTime: 10, difficulty: 'EASY' as const, priority: 'HIGH' as const, status: 'COMPLETED' as const },
    { title: 'Elegir un lugar tranquilo en casa', description: 'Preparar un espacio pequeño y cómodo para meditar', estimatedTime: 15, difficulty: 'EASY' as const, priority: 'MEDIUM' as const, status: 'COMPLETED' as const },
    { title: 'Poner alarma a las 7:30am', description: 'Configurar recordatorio diario', estimatedTime: 5, difficulty: 'EASY' as const, priority: 'HIGH' as const, status: 'COMPLETED' as const },
    { title: 'Primera sesión de 5 minutos', description: 'Solo 5 minutos, con guía de audio', estimatedTime: 5, difficulty: 'EASY' as const, priority: 'URGENT' as const, status: 'IN_PROGRESS' as const },
    { title: 'Llevar un diario de meditación', description: 'Escribir cómo te sentiste después de cada sesión', estimatedTime: 5, difficulty: 'EASY' as const, priority: 'MEDIUM' as const, status: 'PENDING' as const },
    { title: 'Aumentar a 10 minutos diarios', description: 'Cuando ya sea un hábito, extender la sesión', estimatedTime: 10, difficulty: 'MEDIUM' as const, priority: 'MEDIUM' as const, status: 'PENDING' as const },
  ];

  for (let i = 0; i < actions.length; i++) {
    await prisma.action.create({
      data: {
        objectiveId: objective.id,
        ...actions[i],
        order: i,
        completedAt: actions[i].status === 'COMPLETED' ? new Date(Date.now() - (actions.length - i) * 86400000) : null,
      },
    }).catch(() => {});
  }

  console.log('✅ Seed completado');
}

main().catch(console.error).finally(() => prisma.$disconnect());
