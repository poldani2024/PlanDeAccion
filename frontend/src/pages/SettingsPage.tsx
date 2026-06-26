import { useAuthStore } from '../store/auth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { User, Bell, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="text-gray-500 text-sm">Tu cuenta y preferencias.</p>
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <User size={16} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Perfil</h2>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Nombre</span>
            <span className="text-gray-900 font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">{user?.email}</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Bell size={16} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Notificaciones</h2>
        </div>
        <p className="text-sm text-gray-500">Próximamente: recordatorios inteligentes y revisiones semanales.</p>
      </Card>

      <div className="pt-2">
        <Button variant="danger" onClick={handleLogout} className="w-full">
          <LogOut size={16} /> Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
