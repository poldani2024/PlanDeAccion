import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Target, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/auth';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      setError('');
      const res = await authApi.login(data);
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  }

  return (
    <div className="min-h-dvh flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 bg-indigo-600 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Target size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg">Plan de Acción</span>
        </Link>
        <div>
          <blockquote className="text-white/90 text-2xl font-light leading-relaxed mb-6">
            "El secreto del cambio es enfocar toda tu energía no en luchar contra lo viejo,
            sino en construir lo nuevo."
          </blockquote>
          <p className="text-white/60 text-sm">— Sócrates</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { emoji: '🎯', label: 'Objetivos claros' },
            { emoji: '🧠', label: 'Técnicas PNL' },
            { emoji: '📈', label: 'Progreso visible' },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{item.emoji}</div>
              <p className="text-white/80 text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Target size={15} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">Plan de Acción</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Bienvenido de vuelta</h1>
          <p className="text-gray-500 text-sm mb-8">Continuá tu proceso de transformación.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" loading={isSubmitting} size="lg" className="mt-2">
              Iniciar sesión
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="text-indigo-600 font-medium hover:text-indigo-700">
              Registrarte gratis
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">Cuenta de demostración</p>
            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
              <p><span className="text-gray-400">Email:</span> demo@plandeaccion.app</p>
              <p><span className="text-gray-400">Contraseña:</span> demo1234</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
