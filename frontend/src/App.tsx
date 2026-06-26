import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { useAuthStore } from './store/auth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/registro" element={<PublicRoute><RegisterPage /></PublicRoute>} />

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
      </BrowserRouter>
    </QueryClientProvider>
  );
}
