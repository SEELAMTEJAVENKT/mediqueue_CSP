import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Stethoscope, CalendarCheck, DollarSign,
  Activity, ArrowUpRight, ArrowDownRight, Plus, Edit2, Trash2, X,
  Star, ToggleLeft, ToggleRight, ClipboardCheck, Clock, CheckCircle2,
  XCircle, Eye, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { GradientButton } from '../../components/ui/GradientButton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useDoctors } from '../../hooks/useDoctors';
import { useAppointments } from '../../hooks/useAppointments';
import { useHospitals } from '../../hooks/useHospitals';
import { useApprovalRequests, type ApprovalRequest } from '../../hooks/useApprovalRequests';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// Empty-by-default chart data; populated from real appointments when present
const EMPTY_WEEK = [
  { name: 'Mon', appointments: 0 },
  { name: 'Tue', appointments: 0 },
  { name: 'Wed', appointments: 0 },
  { name: 'Thu', appointments: 0 },
  { name: 'Fri', appointments: 0 },
  { name: 'Sat', appointments: 0 },
  { name: 'Sun', appointments: 0 },
];

const COLORS = ['#4F8CFF', '#5EEAD4', '#F59E0B', '#22C55E', '#94A3B8'];

const NoDataOverlay = () => (
  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
    <div className="text-center">
      <p className="text-sm font-medium text-text-secondary">No data available</p>
    </div>
  </div>
);

interface DoctorFormData {
  name: string; email: string; phone: string;
  specialization: string; department: string;
  qualification: string; experience: string;
  consultation_fee: string; consultation_duration_minutes: string;
  languages: string; about: string;
}

const BLANK_FORM: DoctorFormData = {
  name: '', email: '', phone: '', specialization: '', department: '',
  qualification: '', experience: '5', consultation_fee: '500',
  consultation_duration_minutes: '30', languages: 'English, Telugu', about: '',
};

export function AdminDashboardPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const hospitalId = user?.hospitalId;

  const { doctors, loading: docLoading, createDoctor, updateDoctor, deleteDoctor } = useDoctors(hospitalId);
  const { appointments } = useAppointments({ hospitalId });
  const { hospitals } = useHospitals(hospitalId);
  const { requests: approvalRequests, loading: approvalLoading, refetch: refetchApprovals, approve: approveRequest, reject: rejectRequest } = useApprovalRequests(hospitalId);

  const myHospital = hospitals.find(h => h.id === hospitalId);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = useMemo(() => appointments.filter(a => a.date === todayStr), [appointments, todayStr]);
  const completedAppts = useMemo(() => appointments.filter(a => a.status === 'completed'), [appointments]);
  const confirmedAppts = useMemo(() => appointments.filter(a => ['confirmed', 'booked', 'arrived', 'in_queue', 'in_progress', 'completed'].includes(a.status || '')), [appointments]);
  const completionRate = confirmedAppts.length > 0 ? Math.round((completedAppts.length / confirmedAppts.length) * 100) : 0;

  // Specialty distribution from real doctors
  const specialtyDist = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(a => {
      const spec = doctors.find(d => d.id === a.doctor_id)?.specialization || 'Other';
      counts[spec] = (counts[spec] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [appointments, doctors]);

  // Real aggregations from DB rows; default to 0 when no data exists
  const uniquePatientIds = new Set(appointments.map(a => a.patient_id).filter(Boolean));
  const totalPatients = uniquePatientIds.size;
  const totalDoctors = doctors.length;
  const totalAppointments = appointments.length;
  const totalRevenue = useMemo(() => appointments.reduce((sum, a: any) => {
    const fee = a.doctor_id ? doctors.find(d => d.id === a.doctor_id)?.consultation_fee : 0;
    return sum + (Number(fee) || 0);
  }, 0), [appointments, doctors]);

  const approvedDoctors = doctors.filter(d => ['APPROVED', 'ACTIVE'].includes(d.approval_status || '')).length;
  const pendingDoctors = doctors.filter(d => d.approval_status === 'PENDING_APPROVAL').length;

  const stats = [
    { icon: Users, label: t('admin.totalPatients'), value: totalPatients, change: '', up: true, color: 'bg-primary/10 text-primary' },
    { icon: Stethoscope, label: t('admin.totalDoctors'), value: totalDoctors, change: '', up: true, color: 'bg-secondary/20 text-emerald-600' },
    { icon: CheckCircle2, label: 'Approved Doctors', value: approvedDoctors, change: '', up: true, color: 'bg-success/10 text-success' },
    { icon: ClipboardCheck, label: 'Pending Doctor Requests', value: pendingDoctors, change: '', up: true, color: 'bg-warning/10 text-warning' },
    { icon: CalendarCheck, label: "Today's Appointments", value: todayAppts.length, change: '', up: true, color: 'bg-primary/10 text-primary' },
    { icon: DollarSign, label: t('admin.revenue'), value: totalRevenue, prefix: '₹', change: '', up: true, color: 'bg-primary/10 text-primary' },
    { icon: ClipboardCheck, label: 'Pending Consultations', value: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length, change: '', up: true, color: 'bg-warning/10 text-warning' },
    { icon: CheckCircle2, label: 'Completed Consultations', value: completedAppts.length, change: '', up: true, color: 'bg-success/10 text-success' },
  ];

  // Real chart data grouped by weekday; empty when no appointments exist
  const wkData = useMemo(() => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const counts: Record<string, number> = { Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0,Sun:0 };
    appointments.forEach(a => {
      if (!a.date) return;
      const dow = days[new Date(a.date).getDay()];
      if (dow) counts[dow]++;
    });
    return Object.entries(counts).map(([name, appointments]) => ({ name, appointments }));
  }, [appointments]);

  const revenueData = useMemo(() => {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const counts: Record<string, number> = { Mon:0,Tue:0,Wed:0,Thu:0,Fri:0,Sat:0,Sun:0 };
    appointments.forEach(a => {
      if (!a.date) return;
      const dow = days[new Date(a.date).getDay()];
      const fee = a.doctor_id ? doctors.find(d => d.id === a.doctor_id)?.consultation_fee : 0;
      if (dow) counts[dow] += Number(fee) || 0;
    });
    return Object.entries(counts).map(([name, revenue]) => ({ name, revenue }));
  }, [appointments, doctors]);

  /* ---------- Admin section tabs ---------- */
  const [adminTab, setAdminTab] = useState<'overview' | 'approvals' | 'doctors'>('overview');

  /* ---------- Approval request state ---------- */
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvalAction, setApprovalAction] = useState<Record<string, boolean>>({});
  const [approvalError, setApprovalError] = useState('');

  const handleApprove = async (req: ApprovalRequest) => {
    setApprovalAction(p => ({ ...p, [req.id]: true }));
    setApprovalError('');
    try {
      await approveRequest(req.id, user?.name || 'Admin', req.doctor_id);
    } catch (e: any) { setApprovalError(e.message); }
    setApprovalAction(p => ({ ...p, [req.id]: false }));
  };

  const handleReject = async (req: ApprovalRequest) => {
    if (!rejectReason.trim()) { setApprovalError('Please provide a rejection reason.'); return; }
    setApprovalAction(p => ({ ...p, [req.id]: true }));
    setApprovalError('');
    try {
      await rejectRequest(req.id, user?.name || 'Admin', req.doctor_id, rejectReason);
      setRejectingId(null);
      setRejectReason('');
    } catch (e: any) { setApprovalError(e.message); }
    setApprovalAction(p => ({ ...p, [req.id]: false }));
  };

  const pendingApprovals = approvalRequests.filter(r => r.status === 'PENDING_APPROVAL');

  /* ---------- Doctor management modal ---------- */
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [doctorForm, setDoctorForm] = useState<DoctorFormData>(BLANK_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditingDoctorId(null); setDoctorForm(BLANK_FORM); setFormError(''); setShowDoctorModal(true); };
  const openEdit = (doc: ReturnType<typeof useDoctors>['doctors'][0]) => {
    setEditingDoctorId(doc.id);
    setDoctorForm({
      name: doc.name,
      email: doc.email,
      phone: doc.phone || '',
      specialization: doc.specialization,
      department: doc.department || '',
      qualification: doc.qualification || '',
      experience: String(doc.experience || 5),
      consultation_fee: String(doc.consultation_fee || 500),
      consultation_duration_minutes: String(doc.consultation_duration_minutes || 30),
      languages: (doc.languages || []).join(', '),
      about: doc.about || '',
    });
    setFormError('');
    setShowDoctorModal(true);
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        name: doctorForm.name,
        email: doctorForm.email,
        phone: doctorForm.phone || null,
        specialization: doctorForm.specialization,
        department: doctorForm.department || null,
        qualification: doctorForm.qualification || null,
        experience: parseInt(doctorForm.experience) || 0,
        hospital_id: hospitalId || null,
        consultation_fee: parseInt(doctorForm.consultation_fee) || 0,
        consultation_duration_minutes: parseInt(doctorForm.consultation_duration_minutes) || 30,
        languages: doctorForm.languages.split(',').map(s => s.trim()).filter(Boolean),
        about: doctorForm.about || null,
        is_verified: true,
        status: 'active',
        rating: 0,
        review_count: 0,
      };

      if (editingDoctorId) {
        await updateDoctor(editingDoctorId, payload);
      } else {
        await createDoctor(payload);
      }

      setShowDoctorModal(false);
      setDoctorForm(BLANK_FORM);
      setEditingDoctorId(null);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (doc: ReturnType<typeof useDoctors>['doctors'][0]) => {
    const newStatus = doc.status === 'active' ? 'inactive' : 'active';
    await updateDoctor(doc.id, { status: newStatus });
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('Deactivate this doctor permanently?')) return;
    try { await deleteDoctor(id); } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-text-secondary mt-1">
          {myHospital ? myHospital.name : 'Overview of platform performance and analytics'}
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-slate-200 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'approvals', label: `Approval Requests${pendingApprovals.length > 0 ? ` (${pendingApprovals.length})` : ''}`, icon: ClipboardCheck },
          { id: 'doctors', label: 'Doctor Management', icon: Stethoscope },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              adminTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── APPROVAL REQUESTS TAB ── */}
      {adminTab === 'approvals' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {approvalError && (
            <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {approvalError}
            </div>
          )}

          {approvalLoading ? (
            <NeumorphCard><p className="text-text-secondary text-sm text-center py-8">Loading requests...</p></NeumorphCard>
          ) : approvalRequests.length === 0 ? (
            <NeumorphCard>
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-success/40 mx-auto mb-3" />
                <p className="text-text-primary font-medium">No pending requests</p>
                <p className="text-text-secondary text-sm mt-1">All doctor registrations have been reviewed.</p>
              </div>
            </NeumorphCard>
          ) : (
            <>
              {/* Pending first, then reviewed */}
              {(['PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const).map(statusFilter => {
                const group = approvalRequests.filter(r => r.status === statusFilter);
                if (group.length === 0) return null;
                return (
                  <div key={statusFilter}>
                    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
                      statusFilter === 'PENDING_APPROVAL' ? 'text-warning' :
                      statusFilter === 'APPROVED' ? 'text-success' : 'text-danger'
                    }`}>
                      {statusFilter === 'PENDING_APPROVAL' ? `Pending (${group.length})` :
                       statusFilter === 'APPROVED' ? `Approved (${group.length})` : `Rejected (${group.length})`}
                    </h3>
                    <div className="space-y-3">
                      {group.map(req => (
                        <NeumorphCard key={req.id} className="space-y-0 p-0 overflow-hidden">
                          {/* Summary row */}
                          <div
                            className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface/50 transition-colors"
                            onClick={() => setExpandedReqId(expandedReqId === req.id ? null : req.id)}
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                              {req.doctor_name.replace('Dr.', '').trim().charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-text-primary truncate">{req.doctor_name}</p>
                              <p className="text-xs text-text-secondary">{req.specialist_type} · {req.department || '—'}</p>
                            </div>
                            <div className="hidden sm:flex flex-col items-end">
                              <p className="text-xs text-text-secondary">{new Date(req.requested_at).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                              req.status === 'PENDING_APPROVAL' ? 'bg-warning/10 text-warning' :
                              req.status === 'APPROVED' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                            }`}>
                              {req.status === 'PENDING_APPROVAL' ? 'Pending' : req.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                            </span>
                            {expandedReqId === req.id ? <ChevronUp className="w-4 h-4 text-text-secondary flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-secondary flex-shrink-0" />}
                          </div>

                          {/* Expanded details */}
                          <AnimatePresence>
                            {expandedReqId === req.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-slate-100"
                              >
                                <div className="p-4 space-y-4">
                                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {[
                                      { label: 'Doctor ID', value: req.doctor_id_code || '—' },
                                      { label: 'Email', value: req.doctor_email },
                                      { label: 'Mobile', value: req.mobile_number || '—' },
                                      { label: 'Qualification', value: req.qualification || '—' },
                                      { label: 'Experience', value: req.experience != null ? `${req.experience} years` : '—' },
                                      { label: 'License No.', value: req.medical_license_number || '—' },
                                    ].map(item => (
                                      <div key={item.label} className="bg-surface rounded-xl p-3 shadow-neumorph-inset">
                                        <p className="text-xs text-text-secondary mb-0.5">{item.label}</p>
                                        <p className="text-sm font-medium text-text-primary break-all">{item.value}</p>
                                      </div>
                                    ))}
                                  </div>

                                  {req.status === 'PENDING_APPROVAL' && (
                                    <div className="flex flex-wrap gap-3">
                                      <button
                                        onClick={() => handleApprove(req)}
                                        disabled={approvalAction[req.id]}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 text-success hover:bg-success/20 text-sm font-semibold transition-all disabled:opacity-50"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {approvalAction[req.id] ? 'Processing...' : 'Approve'}
                                      </button>
                                      {rejectingId !== req.id ? (
                                        <button
                                          onClick={() => { setRejectingId(req.id); setRejectReason(''); setApprovalError(''); }}
                                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 text-sm font-semibold transition-all"
                                        >
                                          <XCircle className="w-4 h-4" /> Reject
                                        </button>
                                      ) : (
                                        <div className="flex-1 flex flex-col gap-2">
                                          <textarea
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                            placeholder="Reason for rejection (required)..."
                                            rows={2}
                                            className="w-full px-3 py-2 rounded-xl bg-surface shadow-neumorph-inset text-sm text-text-primary resize-none outline-none focus:ring-2 focus:ring-danger/30"
                                          />
                                          <div className="flex gap-2">
                                            <button onClick={() => handleReject(req)} disabled={approvalAction[req.id]} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 text-sm font-semibold transition-all disabled:opacity-50">
                                              <XCircle className="w-3.5 h-3.5" /> Confirm Reject
                                            </button>
                                            <button onClick={() => setRejectingId(null)} className="px-4 py-2 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary text-sm transition-all">
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {req.status === 'REJECTED' && req.rejection_reason && (
                                    <div className="p-3 rounded-xl bg-danger/5 border border-danger/20">
                                      <p className="text-xs text-danger font-medium mb-0.5">Rejection Reason</p>
                                      <p className="text-sm text-text-secondary">{req.rejection_reason}</p>
                                    </div>
                                  )}

                                  {req.status !== 'PENDING_APPROVAL' && (
                                    <p className="text-xs text-text-secondary">
                                      Reviewed by <span className="font-medium text-text-primary">{req.reviewed_by || '—'}</span>{' '}
                                      on {req.reviewed_at ? new Date(req.reviewed_at).toLocaleString() : '—'}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </NeumorphCard>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </motion.div>
      )}

      {/* ── Wrap original content in overview/doctors tabs ── */}
      {(adminTab === 'overview' || adminTab === 'doctors') && <div className="contents">

      {/* Stats Grid — no Total Hospitals card */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <NeumorphCard className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-secondary">{stat.label}</p>
                <p className="text-xl font-bold text-text-primary">
                  <AnimatedCounter end={stat.value} prefix={stat.prefix} suffix="" />
                </p>
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${stat.up ? 'text-success' : 'text-danger'}`}>
                {stat.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {stat.change}
              </div>
            </NeumorphCard>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <NeumorphCard>
            <h3 className="text-lg font-bold text-text-primary mb-4">Weekly Appointments</h3>
            <div className="h-64 relative">
              {totalAppointments === 0 && <NoDataOverlay />}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wkData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748B" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748B" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="appointments" fill="#4F8CFF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </NeumorphCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <NeumorphCard>
            <h3 className="text-lg font-bold text-text-primary mb-4">Appointments by Specialty</h3>
            <div className="h-64 relative">
              {specialtyDist.length === 0 && <NoDataOverlay />}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specialtyDist.length ? specialtyDist : [{ name: 'No Data', value: 1, color: '#94A3B8' }]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value"
                  >
                    {(specialtyDist.length ? specialtyDist : [{ color: '#94A3B8' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {specialtyDist.slice(0, 5).map(s => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-text-secondary">{s.name}</span>
                </div>
              ))}
            </div>
          </NeumorphCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <NeumorphCard>
            <h3 className="text-lg font-bold text-text-primary mb-4">Daily Revenue</h3>
            <div className="h-64 relative">
              {totalRevenue === 0 && <NoDataOverlay />}
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748B" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748B" tickFormatter={v => `₹${v / 1000}k`} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={v => `₹${Number(v).toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </NeumorphCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <NeumorphCard>
            <h3 className="text-lg font-bold text-text-primary mb-4">Hospital Performance</h3>
            <div className="space-y-4">
              {[
                { label: 'Appointment Completion Rate', value: completionRate, suffix: '%', color: '#22C55E' },
                { label: 'Today Appointments', value: todayAppts.length, suffix: '', color: '#4F8CFF' },
                { label: 'Active Doctors', value: doctors.filter(d => d.status === 'active').length, suffix: '', color: '#5EEAD4' },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{m.label}</span>
                    <span className="font-semibold text-text-primary">{m.value}{m.suffix}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface shadow-neumorph-inset overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, m.value || 0)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </NeumorphCard>
        </motion.div>
      </div>

      {/* Live Queue */}
      {todayAppts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
          <NeumorphCard>
            <h3 className="text-lg font-bold text-text-primary mb-4">Today Live Queue</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-text-secondary border-b border-slate-100">
                    <th className="pb-3 font-medium">#</th>
                    <th className="pb-3 font-medium">Patient</th>
                    <th className="pb-3 font-medium">Doctor</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppts.map((appt, i) => {
                    const doc = doctors.find(d => d.id === appt.doctor_id);
                    return (
                      <tr key={appt.id} className="border-b border-slate-50 last:border-0">
                        <td className="py-2 text-sm font-medium text-text-secondary">{(appt.queue_position || i + 1)}</td>
                        <td className="py-2 text-sm text-text-primary">{appt.patient_name || 'Patient'}</td>
                        <td className="py-2 text-sm text-text-secondary">{doc?.name || '—'}</td>
                        <td className="py-2 text-sm text-text-secondary">{appt.start_time}</td>
                        <td className="py-2"><StatusBadge status={appt.status as any} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </NeumorphCard>
        </motion.div>
      )}

      {/* Doctor Management (only shown on doctors tab) */}
      {adminTab === 'doctors' && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
        <NeumorphCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-text-primary">Doctor Management</h3>
            <GradientButton onClick={openAdd}>
              <Plus className="w-4 h-4" />
              Add Doctor
            </GradientButton>
          </div>

          {docLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-surface rounded-xl" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-text-secondary border-b border-slate-100">
                    <th className="pb-3 font-medium">Doctor</th>
                    <th className="pb-3 font-medium">Department / Specialty</th>
                    <th className="pb-3 font-medium">Exp.</th>
                    <th className="pb-3 font-medium">Fee</th>
                    <th className="pb-3 font-medium">Duration</th>
                    <th className="pb-3 font-medium">Rating</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {doctors.map(doc => (
                    <tr key={doc.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                            {doc.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-text-primary">{doc.name}</p>
                            <p className="text-xs text-text-secondary">{doc.qualification}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <p className="text-text-primary">{doc.specialization}</p>
                        {doc.department && <p className="text-xs text-text-secondary">{doc.department}</p>}
                      </td>
                      <td className="py-3 text-text-secondary">{doc.experience}y</td>
                      <td className="py-3 text-text-primary font-medium">₹{doc.consultation_fee}</td>
                      <td className="py-3 text-text-secondary">{doc.consultation_duration_minutes || 30}min</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                          <span className="font-medium">{doc.rating || 0}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'active' || doc.status == null
                            ? 'bg-success/10 text-success'
                            : 'bg-danger/10 text-danger'
                        }`}>
                          {doc.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(doc)} className="p-1.5 rounded-lg bg-surface shadow-neumorph hover:shadow-neumorph-hover text-primary transition-all" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleToggleStatus(doc)} className={`p-1.5 rounded-lg bg-surface shadow-neumorph hover:shadow-neumorph-hover transition-all ${doc.status === 'active' || doc.status == null ? 'text-warning' : 'text-success'}`} title="Toggle Status">
                            {doc.status === 'active' || doc.status == null ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleDeleteDoctor(doc.id)} className="p-1.5 rounded-lg bg-surface shadow-neumorph hover:shadow-neumorph-hover text-danger transition-all" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {doctors.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-text-secondary">No doctors assigned to this hospital yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </NeumorphCard>
      </motion.div>}

      </div>}

      {/* Add/Edit Doctor Modal */}
      <AnimatePresence>
        {showDoctorModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDoctorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <NeumorphCard>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-text-primary">{editingDoctorId ? 'Edit Doctor' : 'Add New Doctor'}</h3>
                  <button onClick={() => setShowDoctorModal(false)} className="p-2 rounded-lg hover:bg-surface/50 text-text-secondary"><X className="w-5 h-5" /></button>
                </div>
                {formError && <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm mb-4">{formError}</div>}
                <form onSubmit={handleDoctorSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Full Name', key: 'name', placeholder: 'Dr. Priya Sharma', required: true },
                      { label: 'Email', key: 'email', placeholder: 'doc@hospital.com', required: true },
                      { label: 'Phone', key: 'phone', placeholder: '+91 98765 43210' },
                      { label: 'Specialization', key: 'specialization', placeholder: 'Cardiology', required: true },
                      { label: 'Department', key: 'department', placeholder: 'Cardiology Dept.' },
                      { label: 'Qualification', key: 'qualification', placeholder: 'MBBS, MD' },
                      { label: 'Experience (years)', key: 'experience', placeholder: '5' },
                      { label: 'Consultation Fee (₹)', key: 'consultation_fee', placeholder: '500' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-text-primary mb-2">{f.label}</label>
                        <input
                          required={f.required}
                          value={(doctorForm as any)[f.key]}
                          onChange={e => setDoctorForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm"
                          placeholder={f.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Consultation Duration</label>
                    <select
                      value={doctorForm.consultation_duration_minutes}
                      onChange={e => setDoctorForm(p => ({ ...p, consultation_duration_minutes: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm"
                    >
                      {[15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Languages (comma separated)</label>
                    <input
                      value={doctorForm.languages}
                      onChange={e => setDoctorForm(p => ({ ...p, languages: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm"
                      placeholder="English, Hindi, Telugu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">About</label>
                    <textarea rows={3} value={doctorForm.about} onChange={e => setDoctorForm(p => ({ ...p, about: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm resize-none"
                      placeholder="Doctor's bio and expertise..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <GradientButton type="submit" disabled={saving} className="flex-1 justify-center">
                      {saving ? 'Saving...' : editingDoctorId ? 'Update Doctor' : 'Add Doctor'}
                    </GradientButton>
                    <button type="button" onClick={() => setShowDoctorModal(false)} className="px-6 py-3 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary font-medium transition-all">Cancel</button>
                  </div>
                </form>
              </NeumorphCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
