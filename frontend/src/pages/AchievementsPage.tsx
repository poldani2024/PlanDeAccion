import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import { achievementsApi } from '../lib/api';
import { Card } from '../components/ui/Card';
import { formatDate } from '../lib/utils';
import type { Achievement, UserAchievement } from '../types';

export default function AchievementsPage() {
  const { data, isLoading } = useQuery<{ earned: UserAchievement[]; all: Achievement[] }>({
    queryKey: ['achievements'],
    queryFn: () => achievementsApi.list().then(r => r.data),
  });

  const earnedIds = new Set(data?.earned.map(e => e.achievement.id) ?? []);
  const earnedMap = new Map(data?.earned.map(e => [e.achievement.id, e]) ?? []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={20} className="text-amber-500" />
          <h1 className="text-2xl font-bold text-gray-900">Logros</h1>
        </div>
        <p className="text-gray-500 text-sm">
          {data?.earned.length ?? 0} de {data?.all.length ?? 0} logros desbloqueados.
        </p>
      </div>

      {/* Earned achievements */}
      {(data?.earned.length ?? 0) > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">Desbloqueados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data?.earned.map((ua) => (
              <motion.div
                key={ua.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -2 }}
              >
                <Card className="text-center border-amber-100 bg-gradient-to-b from-amber-50 to-white">
                  <div className="text-3xl mb-2">{ua.achievement.icon}</div>
                  <p className="font-semibold text-gray-900 text-sm">{ua.achievement.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{ua.achievement.description}</p>
                  <p className="text-xs text-amber-500 mt-2 font-medium">
                    {formatDate(ua.unlockedAt)}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All achievements */}
      <div>
        <h2 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">Todos los logros</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data?.all.map((achievement) => {
              const isEarned = earnedIds.has(achievement.id);
              const earnedData = earnedMap.get(achievement.id);
              return (
                <motion.div key={achievement.id} whileHover={{ y: isEarned ? -2 : 0 }}>
                  <Card
                    className={`text-center ${isEarned ? 'border-amber-100' : 'opacity-60'}`}
                    padding="sm"
                  >
                    <div className={`text-2xl mb-1.5 ${!isEarned ? 'grayscale' : ''}`}>
                      {isEarned ? achievement.icon : <Lock size={20} className="text-gray-300 mx-auto" />}
                    </div>
                    <p className={`font-semibold text-sm ${isEarned ? 'text-gray-900' : 'text-gray-400'}`}>
                      {achievement.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{achievement.description}</p>
                    {isEarned && earnedData && (
                      <p className="text-xs text-amber-500 mt-1 font-medium">✓ Obtenido</p>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
