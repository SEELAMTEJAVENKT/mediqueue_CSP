import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Heart, CalendarDays, FileText,
  ChevronRight, AlertTriangle, Shield, Droplets, Eye
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAppointments } from '../../hooks/useAppointments';
import { useDoctors } from '../../hooks/useDoctors';
import { useHospitals } from '../../hooks/useHospitals';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { AppointmentTimeline } from '../../components/dashboard/AppointmentTimeline';
import { supabase } from '../../lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const NoDataOverlay = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <p className="text-sm font-medium text-text-secondary">No data available</p>
  </div>
);

export function DashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const { appointments, loading: apptLoading } = useAppointments({ patientId: user?.id, hospitalId: user?.hospitalId });
  const { doctors } = useDoctors(user?.hospitalId);
  const { hospitals } = useHospitals(user?.hospitalId);

  const [activeTab, setActiveTab] = useState<'bp' | 'sugar'>('bp');
  const [timelineId, setTimelineId] = useState<string | null>(null);
  const [reportCount, setReportCount] = useState(0);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [healthMetrics, setHealthMetrics] = useState<{ bp: string; sugar: string; bpTrend: any[]; sugarTrend: any[] } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const [{ count: rCount }, { count: pCount }, { data: reports }] = await Promise.all([
        supabase.from('medical_reports').select('id', { count: 'exact', head: true }).eq('patient_id', user.id),
        supabase.from('prescriptions').select('id', { count: 'exact', head: true }).eq('patient_id', user.id),
        supabase.from('medical_reports').select('notes, health_status, created_at').eq('patient_id', user.id).order('created_at', { ascending: true }),
      ]);
      if (cancelled) return;
      setReportCount(rCount || 0);
      setPrescriptionCount(pCount || 0);
      if (reports && reports.length > 0) {
        // Attempt to parse BP/sugar from report notes (format "BP 120/80, Sugar 95")
        const bpTrend: any[] = [];
        const sugarTrend: any[] = [];
        let latestBp = '';
        let latestSugar = '';
        reports.forEach((r: any, idx) => {
          const notes = r.notes || '';
          const bpMatch = notes.match(/BP\s*(\d{2,3}\/\d{2,3})/i);
          const sugarMatch = notes.match(/(?:Sugar|sugar|glucose|Glucose)\s*(\d{2,3})/i);
          if (bpMatch) { latestBp = bpMatch[1]; bpTrend.push({ date: new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: parseInt(bpMatch[1].split('/')[0]) }); }
          if (sugarMatch) { latestSugar = sugarMatch[1] + ' mg/dL'; sugarTrend.push({ date: new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: parseInt(sugarMatch[1]) }); }
        });
        if (latestBp || latestSugar) {
          setHealthMetrics({ bp: latestBp || '—', sugar: latestSugar || '—', bpTrend, sugarTrend });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const upcomingAppointments = appointments.filter(a =>
    a.status === 'confirmed' || a.status === 'pending' || a.status === 'arrived' || a.status === 'in_queue' || a.status === 'in_progress'
  );
  const rejectedAppointments = appointments.filter(a => a.status === 'rejected');

  const getDoctorName = (id: string | null) => doctors.find(d => d.id === id)?.name || 'Unknown';
  const getHospitalName = (id: string | null) => hospitals.find(h => h.id === id)?.name || 'Unknown';

  const healthScore = healthMetrics ? 75 : 0;
  const riskLevel = (healthMetrics ? 'warning' : 'normal') as 'normal' | 'warning';
  const chartData = activeTab === 'bp' ? (healthMetrics?.bpTrend || []) : (healthMetrics?.sugarTrend || []);

  if (apptLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
          {t('dashboard.welcome')}, <span className="gradient-text">{user?.name || 'User'}</span>
        </h1>
        <p className="text-text-secondary mt-1">Here is your health overview for today</p>
      </motion.div>

      {/* Health Score & Risk */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <NeumorphCard className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">{t('dashboard.healthScore')}</p>
              <p className="text-2xl font-bold text-text-primary">{healthScore}/100</p>
            </div>
          </NeumorphCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <NeumorphCard className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">{t('dashboard.riskLevel')}</p>
              <StatusBadge status={riskLevel} />
            </div>
          </NeumorphCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <NeumorphCard className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Latest BP</p>
              <p className="text-2xl font-bold text-text-primary">{healthMetrics?.bp || '—'}</p>
            </div>
          </NeumorphCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <NeumorphCard className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Droplets className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-text-secondary">Latest Sugar</p>
              <p className="text-2xl font-bold text-text-primary">{healthMetrics?.sugar || '—'}</p>
            </div>
          </NeumorphCard>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Charts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <NeumorphCard>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text-primary">
                {activeTab === 'bp' ? t('dashboard.bpTrend') : t('dashboard.sugarTrend')}
              </h3>
              <div className="flex gap-2">
                {(['bp', 'sugar'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab ? 'bg-primary text-white' : 'bg-surface shadow-neumorph text-text-secondary'}`}>
                    {tab === 'bp' ? 'BP' : 'Sugar'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 relative">
              {chartData.length === 0 && <NoDataOverlay />}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F8CFF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4F8CFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748B" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748B" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="value" stroke="#4F8CFF" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </NeumorphCard>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <NeumorphCard className="h-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">{t('dashboard.upcomingAppointments')}</h3>
              <Link to="/appointments" className="text-xs text-primary hover:underline">{t('common.seeAll')}</Link>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.length > 0 ? upcomingAppointments.map(appt => (
                <div key={appt.id} className="p-3 rounded-xl bg-surface shadow-neumorph-inset">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-text-primary truncate">{getDoctorName(appt.doctor_id)}</span>
                    <StatusBadge status={appt.status as any} />
                  </div>
                  <p className="text-xs text-text-secondary">{getHospitalName(appt.hospital_id)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {appt.date}
                      </span>
                      <span>{appt.start_time}</span>
                    </div>
                    <button
                      onClick={() => setTimelineId(timelineId === appt.id ? null : appt.id)}
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      <Eye className="w-3 h-3" />
                      Track
                    </button>
                  </div>

                  {/* Inline Timeline */}
                  <AnimatePresence>
                    {timelineId === appt.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                      >
                        <AppointmentTimeline appointmentId={appt.id} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )) : (
                <p className="text-sm text-text-secondary text-center py-8">{t('common.noData')}</p>
              )}
            </div>

            {/* Rejected Appointments */}
            {rejectedAppointments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-danger mb-3">Rejected Appointments</h4>
                <div className="space-y-2">
                  {rejectedAppointments.map(appt => (
                    <div key={appt.id} className="p-3 rounded-xl bg-danger/5 border border-danger/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-text-primary truncate">{getDoctorName(appt.doctor_id)}</span>
                        <StatusBadge status="rejected" />
                      </div>
                      <p className="text-xs text-text-secondary">{appt.date} at {appt.start_time}</p>
                      {(appt as any).rejection_reason && (
                        <p className="text-xs text-danger mt-1">
                          <span className="font-medium">Reason:</span> {(appt as any).rejection_reason}
                        </p>
                      )}
                      <button
                        onClick={() => setTimelineId(timelineId === appt.id ? null : appt.id)}
                        className="text-xs text-primary flex items-center gap-1 hover:underline mt-1"
                      >
                        <Eye className="w-3 h-3" />
                        Track
                      </button>
                      <AnimatePresence>
                        {timelineId === appt.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 overflow-hidden"
                          >
                            <AppointmentTimeline appointmentId={appt.id} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </NeumorphCard>
        </motion.div>
      </div>

      {/* Recent Reports & Recommended Doctors */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <NeumorphCard>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">{t('dashboard.recentReports')}</h3>
              <Link to="/reports" className="text-xs text-primary hover:underline">{t('common.seeAll')}</Link>
            </div>
            <div className="p-8 rounded-xl bg-surface shadow-neumorph-inset text-center">
              <FileText className="w-12 h-12 text-text-secondary mx-auto mb-3" />
              <p className="text-text-secondary">No reports available yet</p>
              <p className="text-xs text-text-secondary mt-1">Reports will appear after your consultation is completed</p>
            </div>
          </NeumorphCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <NeumorphCard>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">{t('dashboard.recommendedDoctors')}</h3>
              <Link to="/doctors" className="text-xs text-primary hover:underline">{t('common.seeAll')}</Link>
            </div>
            <div className="space-y-3">
              {doctors.slice(0, 3).map(doctor => (
                <Link key={doctor.id} to={`/doctors/${doctor.id}`} className="flex items-center gap-4 p-3 rounded-xl bg-surface shadow-neumorph-inset hover:shadow-neumorph transition-all">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                    {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{doctor.name}</p>
                    <p className="text-xs text-text-secondary">{doctor.specialization}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-secondary" />
                </Link>
              ))}
              {doctors.length === 0 && <p className="text-sm text-text-secondary text-center py-4">No doctors available</p>}
            </div>
          </NeumorphCard>
        </motion.div>
      </div>
    </div>
  );
}
