import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Stethoscope, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { supabase } from '../../lib/supabase';

export function ForgotPasswordPage() {
  const { t } = useLanguage();
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'doctor') navigate('/doctor', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const lowerEmail = email.toLowerCase();

      // Check that an account exists for this email
      const [{ data: patient }, { data: admin }, { data: doctor }] = await Promise.all([
        supabase.from('registered_patients').select('id').eq('email', lowerEmail).maybeSingle(),
        supabase.from('hospital_admins').select('id').eq('email', lowerEmail).maybeSingle(),
        supabase.from('doctors').select('id').eq('email', lowerEmail).maybeSingle(),
      ]);

      if (!patient && !admin && !doctor) {
        throw new Error('No account found with this email address.');
      }

      navigate('/reset-password', { state: { email: lowerEmail } });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <NeumorphCard className="space-y-6">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary text-sm font-medium transition-all"
              aria-label="Go Back"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/30 mb-4">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">{t('auth.forgotPassword')}</h1>
            <p className="text-sm text-text-secondary mt-1">Enter your registered email to reset your password</p>
          </div>
          {error && <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">{t('auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none focus:ring-2 focus:ring-primary/30 text-text-primary text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <GradientButton type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Checking...</>
              ) : (
                <>Continue to Reset Password<ArrowRight className="w-4 h-4" /></>
              )}
            </GradientButton>
          </form>
          <div className="text-center">
            <p className="text-sm text-text-secondary">
              Remember your password?{' '}
              <button onClick={() => navigate('/login', { replace: true })} className="text-primary font-medium hover:underline">
                Back to Login
              </button>
            </p>
          </div>
        </NeumorphCard>
      </motion.div>
    </div>
  );
}
