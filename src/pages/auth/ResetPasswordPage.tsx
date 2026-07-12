import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, Stethoscope, ChevronLeft } from 'lucide-react';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { supabase } from '../../lib/supabase';

interface LocationState {
  email?: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  const email = state?.email || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) { setError('Password is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const { data: patient, error: patientErr } = await supabase
        .from('registered_patients').select('id').eq('email', email.toLowerCase()).maybeSingle();
      if (patientErr) throw patientErr;
      if (patient) {
        await supabase.from('registered_patients').update({ password_hash: btoa(password) }).eq('id', patient.id);
      } else {
        const { data: admin, error: adminErr } = await supabase
          .from('hospital_admins').select('id').eq('email', email.toLowerCase()).maybeSingle();
        if (adminErr) throw adminErr;
        if (admin) {
          await supabase.from('hospital_admins').update({ password_hash: btoa(password) }).eq('id', admin.id);
        } else {
          const { data: doctor, error: doctorErr } = await supabase
            .from('doctors').select('id').eq('email', email.toLowerCase()).maybeSingle();
          if (doctorErr) throw doctorErr;
          if (doctor) {
            await supabase.from('doctors').update({ password_hash: btoa(password) }).eq('id', doctor.id);
          } else {
            throw new Error('Account not found.');
          }
        }
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <NeumorphCard className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Password Updated</h2>
              <p className="text-text-secondary text-sm leading-relaxed">Your password has been updated successfully.</p>
            </div>
            <GradientButton onClick={() => navigate('/login', { replace: true })} className="w-full justify-center">
              Back to Login<ArrowRight className="w-4 h-4" />
            </GradientButton>
          </NeumorphCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <NeumorphCard className="space-y-6">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => navigate('/forgot-password', { replace: true })}
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
            <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
            <p className="text-sm text-text-secondary mt-1">
              Resetting password for <span className="font-medium text-text-primary">{email}</span>
            </p>
          </div>
          {error && <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none focus:ring-2 focus:ring-primary/30 text-text-primary text-sm"
                  placeholder="Min 6 characters"
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
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none focus:ring-2 focus:ring-primary/30 text-text-primary text-sm"
                  placeholder="Re-enter password"
                />
              </div>
            </div>
            <GradientButton type="submit" disabled={loading} className="w-full justify-center">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating...</>
              ) : (
                <>Update Password<ArrowRight className="w-4 h-4" /></>
              )}
            </GradientButton>
          </form>
        </NeumorphCard>
      </motion.div>
    </div>
  );
}
