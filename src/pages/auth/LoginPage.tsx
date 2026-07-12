import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Stethoscope, ArrowRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { GradientButton } from '../../components/ui/GradientButton';

export function LoginPage() {
  const { t } = useLanguage();
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const infoMessage = (location.state as any)?.message as string | undefined;
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      console.log('[Login] User already authenticated, redirecting...');
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'doctor') navigate('/doctor', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Handle back navigation - explicit route to home
  const handleBackNavigation = () => {
    navigate('/', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Login] Starting login', { email: formData.email });
    setError('');
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      console.log('[Login] Login successful, navigating to dashboard');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[Login] Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative"
      >
        <NeumorphCard className="space-y-6">
          {/* Back Navigation Button */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary text-sm font-medium transition-all"
              aria-label="Go Back"
              title="Go Back"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30 mb-4">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{t('auth.login')}</h1>
            <p className="text-sm text-text-secondary mt-1">Welcome back to MediQueue</p>
          </div>

          {infoMessage && (
            <div className="p-3 rounded-xl bg-primary/10 text-primary text-sm text-center">
              {infoMessage}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none focus:ring-2 focus:ring-primary/30 text-text-primary text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none focus:ring-2 focus:ring-primary/30 text-text-primary text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <GradientButton type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  {t('auth.login')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </GradientButton>
          </form>

          <div className="text-center">
            <p className="text-sm text-text-secondary">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                {t('auth.register')}
              </Link>
            </p>
          </div>
        </NeumorphCard>
      </motion.div>
    </div>
  );
}
