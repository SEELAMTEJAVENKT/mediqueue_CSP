import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CalendarDays, Users, FileText, Clock, CheckCircle,
  XCircle, Stethoscope, UserCheck, Play, Eye, AlertCircle,
  RefreshCcw, Sunrise, ClipboardList, X, Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAppointments } from '../../hooks/useAppointments';
import { useDoctors } from '../../hooks/useDoctors';
import { useHospitals } from '../../hooks/useHospitals';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { AppointmentTimeline } from '../../components/dashboard/AppointmentTimeline';
import { supabase } from '../../lib/supabase';

interface PatientInfo {
  id: string;
  name: string | null;
  date_of_birth: string | null;
  gender: string | null;
}

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age > 0 ? `${age}y` : '—';
}

function ApprovalStatusBanner({ status }: { status: string }) {
  const config = {
    PENDING_APPROVAL: { title: 'Account Awaiting Approval', body: 'Your account is awaiting hospital administrator approval. You will be notified once reviewed.', cls: 'bg-warning/10 border border-warning/30 text-warning' },
    REJECTED: { title: 'Registration Rejected', body: 'Your registration request was rejected. Please contact the hospital administrator.', cls: 'bg-danger/10 border border-danger/30 text-danger' },
    SUSPENDED: { title: 'Account Suspended', body: 'Your account has been suspended. Please contact the hospital administrator.', cls: 'bg-danger/10 border border-danger/30 text-danger' },
  } as Record<string, { title: string; body: string; cls: string }>;
  const cfg = config[status];
  if (!cfg) return null;
  return (
    <div className="max-w-xl mx-auto px-4 pt-16">
      <div className={`p-6 rounded-2xl ${cfg.cls}`}>
        <p className="font-bold text-lg mb-2">{cfg.title}</p>
        <p className="text-sm opacity-80">{cfg.body}</p>
      </div>
    </div>
  );
}

export function DoctorDashboardPage() {
  const { user } = useAuth();
  const { doctors, loading: doctorsLoading } = useDoctors(user?.hospitalId);
  const { hospitals } = useHospitals(user?.hospitalId);

  const doctor = doctors.find(d => d.email === user?.email || d.id === user?.doctorId);

  // Block access for non-approved doctors
  const approvalStatus = (doctor as any)?.approval_status;
  if (!doctorsLoading && doctor && approvalStatus && !['APPROVED', 'ACTIVE'].includes(approvalStatus)) {
    return <ApprovalStatusBanner status={approvalStatus} />;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();
  const tomorrowLabel = new Date(tomorrowStr + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  const { appointments, loading: apptLoading, transitionAppointment, approveAppointment, rejectAppointment } = useAppointments({
    doctorId: doctor?.id,
    hospitalId: user?.hospitalId,
  });

  const myAppointments = appointments;
  const todayAppointments = useMemo(() =>
    myAppointments
      .filter(a => a.date === todayStr && a.status === 'confirmed')
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [myAppointments, todayStr]
  );
  const tomorrowAppointments = useMemo(() =>
    myAppointments
      .filter(a => a.date === tomorrowStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [myAppointments, tomorrowStr]
  );
  const pendingAppointments = useMemo(() => myAppointments.filter(a => a.status === 'pending'), [myAppointments]);
  const completedAppointments = useMemo(() => myAppointments.filter(a => a.status === 'completed'), [myAppointments]);

  const [timelineId, setTimelineId] = useState<string | null>(null);
  const [transitionLoading, setTransitionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState('');
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [patientInfo, setPatientInfo] = useState<Record<string, PatientInfo>>({});
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch patient info for pending appointments
  const fetchPatientInfo = useCallback(async (patientIds: string[]) => {
    const unique = [...new Set(patientIds)].filter(Boolean);
    const missing = unique.filter(id => !patientInfo[id]);
    if (missing.length === 0) return;
    const { data } = await supabase
      .from('registered_patients')
      .select('id, name, date_of_birth, gender')
      .in('id', missing);
    if (data) {
      const map: Record<string, PatientInfo> = {};
      data.forEach((p: any) => { map[p.id] = p; });
      setPatientInfo(prev => ({ ...prev, ...map }));
    }
  }, [patientInfo]);

  useEffect(() => {
    const ids = pendingAppointments.map(a => a.patient_id).filter(Boolean) as string[];
    fetchPatientInfo(ids);
  }, [pendingAppointments, fetchPatientInfo]);

  const handleTransition = async (id: string, status: string) => {
    setTransitionLoading(p => ({ ...p, [id]: true }));
    setActionError('');
    try {
      await transitionAppointment(id, status);
      showToast(`Appointment marked as ${status}`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update');
      showToast('Failed to update appointment', 'error');
    } finally {
      setTransitionLoading(p => ({ ...p, [id]: false }));
    }
  };

  const handleApprove = async (id: string) => {
    setTransitionLoading(p => ({ ...p, [id]: true }));
    setActionError('');
    try {
      await approveAppointment(id);
      showToast('Appointment approved successfully');
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve');
      showToast('Failed to approve appointment', 'error');
    } finally {
      setTransitionLoading(p => ({ ...p, [id]: false }));
    }
  };

  const handleReject = async () => {
    if (!rejectModalId) return;
    if (!rejectionReason.trim()) {
      setActionError('Please enter a rejection reason.');
      return;
    }
    setTransitionLoading(p => ({ ...p, [rejectModalId]: true }));
    setActionError('');
    try {
      await rejectAppointment(rejectModalId, rejectionReason.trim());
      setRejectModalId(null);
      setRejectionReason('');
      showToast('Appointment rejected');
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject');
      showToast('Failed to reject appointment', 'error');
    } finally {
      setTransitionLoading(p => ({ ...p, [rejectModalId]: false }));
    }
  };

  const getHospitalName = (id: string | null) => hospitals.find(h => h.id === id)?.name || '';
  const getDepartmentName = (appt: any) => {
    if (appt.department_id) {
      const hosp = hospitals.find(h => h.id === appt.hospital_id);
      const dept = (hosp?.departments || []).find((d: any) => d.id === appt.department_id);
      if (dept) return dept.name;
    }
    return doctor?.department || doctor?.specialization || '—';
  };

  const stats = [
    { icon: ClipboardList, label: 'Pending Requests', value: pendingAppointments.length, color: 'bg-warning/10 text-warning' },
    { icon: CalendarDays, label: "Today's Queue", value: todayAppointments.length, color: 'bg-primary/10 text-primary' },
    { icon: Users, label: 'Total Patients', value: myAppointments.length, color: 'bg-secondary/20 text-emerald-600' },
    { icon: CheckCircle, label: 'Completed', value: completedAppointments.length, color: 'bg-success/10 text-success' },
  ];

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
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Doctor Dashboard</h1>
        <p className="text-text-secondary mt-1">Welcome back, {doctor?.name || user?.name}</p>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <NeumorphCard className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-secondary">{stat.label}</p>
              </div>
            </NeumorphCard>
          </motion.div>
        ))}
      </div>

      {actionError && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 text-danger text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {actionError}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 ${toast.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'}`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Appointment Requests */}
      <NeumorphCard className="mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-warning" />
            <h3 className="text-lg font-bold text-text-primary">Pending Appointment Requests</h3>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning">
            {pendingAppointments.length} pending
          </span>
        </div>
        <div className="space-y-3">
          {pendingAppointments.length > 0 ? pendingAppointments.map(appt => {
            const pInfo = patientInfo[appt.patient_id || ''];
            return (
              <div key={appt.id} className="p-4 rounded-xl bg-surface shadow-neumorph-inset">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {(appt.patient_name || 'P').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs text-text-secondary">Patient Name</p>
                      <p className="text-sm font-medium text-text-primary">{appt.patient_name || 'Patient'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Age</p>
                      <p className="text-sm font-medium text-text-primary">{calcAge(pInfo?.date_of_birth || null)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Gender</p>
                      <p className="text-sm font-medium text-text-primary">{pInfo?.gender || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Appointment Date</p>
                      <p className="text-sm font-medium text-text-primary">{appt.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Appointment Time</p>
                      <p className="text-sm font-medium text-text-primary">{appt.start_time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Department</p>
                      <p className="text-sm font-medium text-text-primary">{getDepartmentName(appt)}</p>
                    </div>
                    {appt.symptoms && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-text-secondary">Symptoms</p>
                        <p className="text-sm text-text-primary">{appt.symptoms}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-text-secondary">Booking Time</p>
                      <p className="text-sm text-text-secondary">{appt.created_at ? new Date(appt.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={() => handleApprove(appt.id)}
                    disabled={transitionLoading[appt.id]}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success/10 text-success hover:bg-success/20 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {transitionLoading[appt.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectModalId(appt.id); setRejectionReason(''); setActionError(''); }}
                    disabled={transitionLoading[appt.id]}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 text-sm font-medium transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => setTimelineId(timelineId === appt.id ? null : appt.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface shadow-neumorph text-text-secondary hover:text-primary text-sm font-medium transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    Timeline
                  </button>
                </div>
                <AnimatePresence>
                  {timelineId === appt.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-100 overflow-hidden"
                    >
                      <AppointmentTimeline appointmentId={appt.id} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }) : (
            <p className="text-sm text-text-secondary text-center py-8">No pending appointment requests.</p>
          )}
        </div>
      </NeumorphCard>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Queue */}
        <div className="lg:col-span-2">
          <NeumorphCard>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-text-primary">Today&apos;s Queue</h3>
              <span className="text-xs text-text-secondary">{todayStr}</span>
            </div>
            <div className="space-y-3">
              {todayAppointments.length > 0 ? todayAppointments.map(appt => {
                const waitingMins = appt.arrival_time
                  ? Math.round((new Date(appt.consultation_start || new Date().toISOString()).getTime() - new Date(appt.arrival_time).getTime()) / 60000)
                  : null;
                return (
                  <div key={appt.id} className="p-3 rounded-xl bg-surface shadow-neumorph-inset">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                        {(appt.patient_name || 'P').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{appt.patient_name || 'Patient'}</p>
                        <p className="text-xs text-text-secondary">{getHospitalName(appt.hospital_id)} · {appt.start_time}</p>
                        {appt.queue_position && <p className="text-xs text-primary">Queue #{appt.queue_position}</p>}
                        {waitingMins != null && appt.status !== 'in_progress' && appt.status !== 'completed' && (
                          <p className="text-xs text-text-secondary">Waiting: {waitingMins} min</p>
                        )}
                      </div>
                      <StatusBadge status={appt.status as any} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {appt.status === 'confirmed' && (
                        <button
                          onClick={() => handleTransition(appt.id, 'arrived')}
                          disabled={transitionLoading[appt.id]}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 text-xs font-medium transition-all disabled:opacity-50"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Patient Arrived
                        </button>
                      )}
                      {(appt.status === 'arrived' || appt.status === 'in_queue') && (
                        <button
                          onClick={() => handleTransition(appt.id, 'in_progress')}
                          disabled={transitionLoading[appt.id]}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-all disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Start Consultation
                        </button>
                      )}
                      {appt.status === 'in_progress' && (
                        <button
                          onClick={() => handleTransition(appt.id, 'completed')}
                          disabled={transitionLoading[appt.id]}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 text-xs font-medium transition-all disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Complete Consultation
                        </button>
                      )}
                      {appt.status === 'completed' && (
                        <Link
                          to="/doctor/prescriptions"
                          state={{ appointmentId: appt.id }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Write Prescription
                        </Link>
                      )}
                      <button
                        onClick={() => setTimelineId(timelineId === appt.id ? null : appt.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface shadow-neumorph text-text-secondary hover:text-primary text-xs font-medium transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Timeline
                      </button>
                    </div>

                    {/* Inline Timeline */}
                    <AnimatePresence>
                      {timelineId === appt.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-slate-100 overflow-hidden"
                        >
                          <AppointmentTimeline appointmentId={appt.id} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }) : (
                <p className="text-sm text-text-secondary text-center py-8">No confirmed appointments for today</p>
              )}
            </div>
          </NeumorphCard>
        </div>

        {/* Tomorrow's Bookings + Quick Actions */}
        <div className="space-y-4">
          {/* Tomorrow's Bookings */}
          <NeumorphCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Sunrise className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Tomorrow</h3>
                  <p className="text-xs text-text-secondary">{tomorrowLabel}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                {tomorrowAppointments.length} booked
              </span>
            </div>

            {tomorrowAppointments.length > 0 ? (
              <div className="space-y-2">
                {tomorrowAppointments.map((appt, idx) => (
                  <motion.div
                    key={appt.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface shadow-neumorph-inset"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(appt.patient_name || 'P').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {appt.patient_name || 'Patient'}
                      </p>
                      <p className="text-xs text-text-secondary">{appt.start_time} — {appt.end_time}</p>
                      {appt.symptoms && (
                        <p className="text-xs text-text-secondary truncate mt-0.5 italic">{appt.symptoms}</p>
                      )}
                    </div>
                    <StatusBadge status={appt.status as any} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Sunrise className="w-8 h-8 text-amber-300 mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No bookings for tomorrow</p>
              </div>
            )}
          </NeumorphCard>

          <NeumorphCard>
            <h3 className="text-base font-bold text-text-primary mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link to="/doctor/schedule" className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface shadow-neumorph hover:shadow-neumorph-hover transition-all text-sm text-text-primary">
                <CalendarDays className="w-4 h-4 text-primary" />
                Manage Schedule
              </Link>
              <Link to="/reports" className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface shadow-neumorph hover:shadow-neumorph-hover transition-all text-sm text-text-primary">
                <FileText className="w-4 h-4 text-primary" />
                View Reports
              </Link>
              <Link to="/doctor/prescriptions" className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface shadow-neumorph hover:shadow-neumorph-hover transition-all text-sm text-text-primary">
                <Stethoscope className="w-4 h-4 text-primary" />
                Write Prescription
              </Link>
              <Link to="/appointments" className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface shadow-neumorph hover:shadow-neumorph-hover transition-all text-sm text-text-primary">
                <RefreshCcw className="w-4 h-4 text-primary" />
                All Appointments
              </Link>
            </div>
          </NeumorphCard>

          <NeumorphCard>
            <h3 className="text-base font-bold text-text-primary mb-3">My Profile</h3>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
                {(doctor?.name || user?.name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-text-primary">{doctor?.name || user?.name}</p>
                <p className="text-sm text-primary">{doctor?.specialization}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-text-secondary">Rating:</span>
                  <span className="text-xs font-bold text-text-primary">{doctor?.rating || 0}</span>
                  <span className="text-xs text-text-secondary">({doctor?.review_count || 0} reviews)</span>
                </div>
              </div>
            </div>
          </NeumorphCard>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      <AnimatePresence>
        {rejectModalId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => { setRejectModalId(null); setRejectionReason(''); setActionError(''); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <NeumorphCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-text-primary">Reject Appointment</h3>
                  <button onClick={() => { setRejectModalId(null); setRejectionReason(''); setActionError(''); }} className="p-2 rounded-lg hover:bg-surface/50 text-text-secondary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {actionError && (
                  <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm mb-4">{actionError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">Rejection Reason *</label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Enter the reason for rejecting this appointment..."
                    className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleReject}
                    disabled={transitionLoading[rejectModalId]}
                    className="flex-1 px-4 py-3 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 font-medium text-sm transition-all disabled:opacity-50"
                  >
                    {transitionLoading[rejectModalId] ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Reject'}
                  </button>
                  <button
                    onClick={() => { setRejectModalId(null); setRejectionReason(''); setActionError(''); }}
                    className="px-6 py-3 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary font-medium text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </NeumorphCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
