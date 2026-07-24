import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './store/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ObjectivesPage from './pages/ObjectivesPage';
import NewObjectivePage from './pages/NewObjectivePage';
import ObjectiveDetailPage from './pages/ObjectiveDetailPage';
import ActionsPage from './pages/ActionsPage';
import DailyLogPage from './pages/DailyLogPage';
import NlpPage from './pages/NlpPage';
import StatsPage from './pages/StatsPage';
import AchievementsPage from './pages/AchievementsPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName ?? 'Usuario',
          email: firebaseUser.email ?? '',
          avatar: firebaseUser.photoURL ?? undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [setUser, setLoading]);

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthInitializer>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/objetivos" element={<ProtectedRoute><ObjectivesPage /></ProtectedRoute>} />
            <Route path="/objetivos/nuevo" element={<ProtectedRoute><NewObjectivePage /></ProtectedRoute>} />
            <Route path="/objetivos/:id" element={<ProtectedRoute><ObjectiveDetailPage /></ProtectedRoute>} />
            <Route path="/objetivos/:id/acciones" element={<ProtectedRoute><ActionsPage /></ProtectedRoute>} />
            <Route path="/objetivos/:id/registro" element={<ProtectedRoute><DailyLogPage /></ProtectedRoute>} />

            <Route path="/estadisticas" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
            <Route path="/pnl" element={<ProtectedRoute><NlpPage /></ProtectedRoute>} />
            <Route path="/logros" element={<ProtectedRoute><AchievementsPage /></ProtectedRoute>} />
            <Route path="/ajustes" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
