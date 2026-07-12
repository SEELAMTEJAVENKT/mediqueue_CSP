import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, CheckCircle, Lock, Unlock,
  ChevronLeft, ChevronRight, AlertTriangle,
  Sun, Moon, Edit2, Zap, CalendarDays, Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDoctors } from '../../hooks/useDoctors';
import { useDoctorSlots } from '../../hooks/useDoctorSlots';
import { useSchedules, type ScheduleRow } from '../../hooks/useSchedules';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { GradientButton } from '../../components/ui/GradientButton';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DURATION_OPTIONS = [15, 20, 30, 45, 60];

export function DoctorSchedulePage() {
  const { user } = useAuth();
  const { doctors, loading: doctorsLoading } = useDoctors(user?.hospitalId);
  const doctor = doctors.find(d => d.email === user?.email || d.id === user?.doctorId);
  const doctorId = doctor?.id;
  const hospitalId = user?.hospitalId;

  const { slots, loading: slotsLoading, error, createSlot, deleteSlot, toggleSlotStatus, deleteAllSlots, generateSlots } = useDoctorSlots(doctorId);
  const scheduleHook = useSchedules(doctorId, hospitalId);

  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [schLoading, setSchLoading] = useState(true);
  const [genStatus, setGenStatus] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadSchedules = async () => {
    setSchLoading(true);
    try { setSchedules(await scheduleHook.list()); } catch { }
    setSchLoading(false);
  };

  const handleClearAllSlots = async () => {
    if (!confirm('Delete ALL available (unbooked) slots? Booked slots will be preserved.')) return;
    setBulkDeleting(true);
    try {
      await deleteAllSlots();
      setGenStatus('All available slots cleared.');
      setTimeout(() => setGenStatus(''), 4000);
    } catch (err: any) {
      setGenStatus(err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteAllSchedules = async () => {
    if (!confirm('Delete ALL schedules? This does NOT delete already-generated slots.')) return;
    setBulkDeleting(true);
    try {
      for (const s of schedules) await scheduleHook.remove(s.id);
      await loadSchedules();
      setGenStatus('All schedules deleted.');
      setTimeout(() => setGenStatus(''), 4000);
    } catch (err: any) {
      setGenStatus(err.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  useEffect(() => { loadSchedules(); }, [doctorId]);

  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const diff = d.getDate() - d.getDay();
    return new Date(new Date(d).setDate(diff));
  });

  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [currentWeekStart]);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  const formatDisplay = (d: Date) => d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  const todayStr = formatDate(new Date());

  const slotsByDate = useMemo(() => {
    const map: Record<string, typeof slots> = {};
    weekDates.forEach(d => {
      const key = formatDate(d);
      map[key] = slots.filter(s => s.date === key).sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return map;
  }, [slots, weekDates]);

  // Modals
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ScheduleRow | null>(null);
  const [showQuickGen, setShowQuickGen] = useState(false);

  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('09:00');
  const [slotSaving, setSlotSaving] = useState(false);

  // Quick Generate state
  const todayIso = new Date().toISOString().split('T')[0];
  const [qgStartDate, setQgStartDate] = useState(todayIso);
  const [qgEndDate, setQgEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 6);
    return d.toISOString().split('T')[0];
  });
  const [qgShift1Start, setQgShift1Start] = useState('09:00');
  const [qgShift1End, setQgShift1End] = useState('12:00');
  const [qgShift2Start, setQgShift2Start] = useState('14:00');
  const [qgShift2End, setQgShift2End] = useState('17:00');
  const [qgUseShift2, setQgUseShift2] = useState(true);
  const [qgDuration, setQgDuration] = useState(doctor?.consultation_duration_minutes || 30);
  const [qgSaving, setQgSaving] = useState(false);

  const handleQuickGenerate = async () => {
    if (!doctorId) return;
    setQgSaving(true);
    setGenStatus('');
    try {
      // Build array of all dates in range
      const dates: string[] = [];
      const cur = new Date(qgStartDate + 'T00:00:00');
      const end = new Date(qgEndDate + 'T00:00:00');
      while (cur <= end) {
        dates.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
      if (dates.length === 0) { setGenStatus('Invalid date range.'); setQgSaving(false); return; }

      const timeRanges: { start: string; end: string }[] = [
        { start: qgShift1Start, end: qgShift1End },
        ...(qgUseShift2 ? [{ start: qgShift2Start, end: qgShift2End }] : []),
      ];

      const result = await generateSlots(doctorId, dates, timeRanges, qgDuration);
      setGenStatus(result.message);
      setShowQuickGen(false);
    } catch (err: any) {
      setGenStatus(err.message || 'Failed to generate slots');
    } finally {
      setQgSaving(false);
      setTimeout(() => setGenStatus(''), 6000);
    }
  };

  const [schForm, setSchForm] = useState({
    schedule_date: formatDate(new Date()),
    shift1_start: '09:00',
    shift1_end: '12:00',
    shift2_start: '14:00',
    shift2_end: '17:00',
    slot_duration_minutes: doctor?.consultation_duration_minutes || 30,
    is_active: true,
  });
  const [schSaving, setSchSaving] = useState(false);
  const [schError, setSchError] = useState('');

  const handleAddSlot = async () => {
    if (!doctorId || !slotDate || !slotTime) return;
    setSlotSaving(true);
    try {
      const [h, m] = slotTime.split(':').map(Number);
      const endMins = h * 60 + m + (doctor?.consultation_duration_minutes || 30);
      const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
      await createSlot({ doctor_id: doctorId, date: slotDate, start_time: slotTime, end_time: endTime, is_booked: false, is_locked: false, status: 'AVAILABLE' } as any);
      setShowAddSlot(false);
      setSlotTime('09:00');
    } catch (err: any) { setGenStatus(err.message); }
    setSlotSaving(false);
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Delete this slot?')) return;
    try { await deleteSlot(id); } catch (err: any) { setGenStatus(err.message); }
  };

  const handleSchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchError('');
    if (!doctorId || !hospitalId) {
      setSchError('Doctor profile not linked to your account. Contact your administrator.');
      return;
    }
    setSchSaving(true);
    try {
      if (editSchedule) {
        await scheduleHook.update(editSchedule.id, { ...schForm });
      } else {
        await scheduleHook.create({ ...schForm, doctor_id: doctorId, hospital_id: hospitalId });
      }
      await loadSchedules();
      setShowAddSchedule(false);
      setEditSchedule(null);
    } catch (err: any) { setSchError(err.message); }
    setSchSaving(false);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Delete this schedule?')) return;
    try { await scheduleHook.remove(id); await loadSchedules(); } catch (err: any) { setSchError(err.message); }
  };

  const handleAutoGenerate = async () => {
    if (!doctorId || !hospitalId) { setGenStatus('Doctor profile not linked. Contact your administrator.'); return; }
    setGenStatus('Generating…');
    try {
      const result = await scheduleHook.generateSlots(doctorId, hospitalId);
      setGenStatus(result.message);
    } catch (err: any) {
      setGenStatus(err.message || 'Failed');
    }
    setTimeout(() => setGenStatus(''), 5000);
  };

  const openEditSchedule = (s: ScheduleRow) => {
    setEditSchedule(s);
    setSchForm({
      schedule_date: s.schedule_date,
      shift1_start: s.shift1_start,
      shift1_end: s.shift1_end,
      shift2_start: s.shift2_start || '14:00',
      shift2_end: s.shift2_end || '17:00',
      slot_duration_minutes: s.slot_duration_minutes,
      is_active: s.is_active,
    });
    setShowAddSchedule(true);
  };

  if (doctorsLoading || slotsLoading) return <div className="max-w-7xl mx-auto px-4 py-8"><LoadingSkeleton lines={6} /></div>;

  // Block access for non-approved doctors
  const approvalStatus = (doctor as any)?.approval_status;
  if (doctor && approvalStatus && !['APPROVED', 'ACTIVE'].includes(approvalStatus)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="p-6 rounded-2xl bg-warning/10 border border-warning/30 text-warning text-center">
          <p className="font-bold text-lg mb-2">Account Awaiting Approval</p>
          <p className="text-sm opacity-80">Your account is awaiting hospital administrator approval. Schedule management will be available once approved.</p>
        </div>
      </div>
    );
  }

  if (!doctorId) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="p-6 rounded-2xl bg-warning/10 border border-warning/30 text-warning text-center">
        <p className="font-semibold">Doctor profile not linked to this account.</p>
        <p className="text-sm mt-1 text-text-secondary">Please contact an administrator to link your account to a doctor profile.</p>
      </div>
    </div>
  );
  if (error) return <div className="max-w-7xl mx-auto px-4 py-8"><div className="p-4 rounded-xl bg-danger/10 text-danger text-center">{error}</div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Manage Schedule</h1>
            <p className="text-text-secondary mt-1">{doctor?.name || user?.name} · {doctor?.specialization}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowQuickGen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Quick Generate
            </button>
            <button
              onClick={handleAutoGenerate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-success to-emerald-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Zap className="w-4 h-4" />
              From Schedules
            </button>
            <GradientButton onClick={() => { setShowAddSchedule(true); setEditSchedule(null); setSchForm({ schedule_date: formatDate(new Date()), shift1_start: '09:00', shift1_end: '12:00', shift2_start: '14:00', shift2_end: '17:00', slot_duration_minutes: doctor?.consultation_duration_minutes || 30, is_active: true }); }}>
              <Plus className="w-4 h-4" />
              Add Schedule
            </GradientButton>
            <GradientButton variant="secondary" onClick={() => setShowAddSlot(true)}>
              <Plus className="w-4 h-4" />
              Add Slot
            </GradientButton>
            <button
              onClick={handleClearAllSlots}
              disabled={bulkDeleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 text-sm font-semibold transition-all disabled:opacity-50"
              title="Delete all unbooked slots"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Slots
            </button>
          </div>
        </div>
        {genStatus && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-xl bg-success/10 text-success text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {genStatus}
          </motion.div>
        )}
      </motion.div>

      {/* Schedules List */}
      {!schLoading && schedules.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <NeumorphCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-text-primary">Schedules</h3>
              <button
                onClick={handleDeleteAllSchedules}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 text-xs font-semibold text-danger hover:bg-danger/10 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
                title="Delete all schedules"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete All Schedules
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {schedules.map(s => (
                <div key={s.id} className={`p-3 rounded-xl ${s.is_active ? 'bg-primary/5' : 'bg-surface shadow-neumorph-inset opacity-60'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-text-primary flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-primary" />
                      {s.schedule_date}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => openEditSchedule(s)} className="p-1 rounded text-text-secondary hover:text-primary"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteSchedule(s.id)} className="p-1 rounded text-text-secondary hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <Sun className="w-3 h-3 text-warning" />
                      <span>Shift 1: {s.shift1_start} – {s.shift1_end}</span>
                    </div>
                    {s.shift2_start && s.shift2_end && (
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Moon className="w-3 h-3 text-primary" />
                        <span>Shift 2: {s.shift2_start} – {s.shift2_end}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-primary mt-1">{s.slot_duration_minutes} min slots</p>
                </div>
              ))}
            </div>
          </NeumorphCard>
        </motion.div>
      )}

      {/* Week Navigator */}
      <NeumorphCard className="mb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d); }} className="p-2 rounded-xl bg-surface shadow-neumorph hover:shadow-neumorph-hover text-text-secondary hover:text-text-primary transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">{formatDisplay(weekDates[0])} – {formatDisplay(weekDates[6])}</p>
            <p className="text-xs text-text-secondary">{weekDates[0].getFullYear()}</p>
          </div>
          <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d); }} className="p-2 rounded-xl bg-surface shadow-neumorph hover:shadow-neumorph-hover text-text-secondary hover:text-text-primary transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </NeumorphCard>

      {/* Weekly Grid */}
      <div className="grid grid-cols-7 gap-3 mb-8">
        {weekDates.map((date, i) => {
          const dateStr = formatDate(date);
          const daySlots = slotsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;

          return (
            <motion.div key={dateStr} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <div className={`text-center mb-2 ${isToday ? 'text-primary font-bold' : 'text-text-secondary'}`}>
                <p className="text-xs uppercase">{WEEK_DAYS[date.getDay()]}</p>
                <p className={`text-lg ${isToday ? 'text-primary' : ''}`}>{date.getDate()}</p>
              </div>
              <div className="space-y-1.5 min-h-[120px]">
                {daySlots.map(slot => (
                  <div key={slot.id} className={`p-1.5 rounded-lg text-[10px] transition-all ${
                    slot.is_booked ? 'bg-danger/10 text-danger' : slot.is_locked ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{slot.start_time}</span>
                      <div className="flex gap-0.5">
                        {!slot.is_booked && (
                          <button onClick={() => toggleSlotStatus(slot.id, 'is_locked')} className="p-0.5 rounded hover:bg-white/30">
                            {slot.is_locked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                          </button>
                        )}
                        <button onClick={() => handleDeleteSlot(slot.id)} className="p-0.5 rounded hover:bg-white/30">
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                    <p className="opacity-70">{slot.is_booked ? 'Booked' : slot.is_locked ? 'Locked' : 'Free'}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-8">
        {[{ color: 'bg-success', label: 'Available' }, { color: 'bg-warning', label: 'Locked' }, { color: 'bg-danger', label: 'Booked' }].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${l.color}`} />
            <span className="text-xs text-text-secondary">{l.label}</span>
          </div>
        ))}
      </div>

      {/* All Slots Table */}
      <NeumorphCard>
        <h3 className="text-lg font-bold text-text-primary mb-4">Upcoming Slots</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-text-secondary border-b border-slate-100">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {slots.filter(s => s.date >= todayStr).slice(0, 30).map(slot => (
                <tr key={slot.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2 text-text-primary">{slot.date}</td>
                  <td className="py-2 text-text-primary">{slot.start_time} – {slot.end_time}</td>
                  <td className="py-2">
                    {slot.is_booked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/10 text-danger text-xs"><AlertTriangle className="w-3 h-3" /> Booked</span>
                    ) : slot.is_locked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs"><Lock className="w-3 h-3" /> Locked</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-xs"><CheckCircle className="w-3 h-3" /> Available</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!slot.is_booked && (
                        <button onClick={() => toggleSlotStatus(slot.id, 'is_locked')} className="p-1.5 rounded-lg bg-surface shadow-neumorph hover:shadow-neumorph-hover text-text-secondary hover:text-primary transition-all" title={slot.is_locked ? 'Unlock' : 'Lock'}>
                          {slot.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <button onClick={() => handleDeleteSlot(slot.id)} className="p-1.5 rounded-lg bg-surface shadow-neumorph hover:shadow-neumorph-hover text-text-secondary hover:text-danger transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {slots.filter(s => s.date >= todayStr).length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-text-secondary">No upcoming slots. Add schedules and click "Auto Generate Slots".</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </NeumorphCard>

      {/* Add Single Slot Modal */}
      <AnimatePresence>
        {showAddSlot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddSlot(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-md">
              <NeumorphCard>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-text-primary">Add Single Slot</h3>
                  <button onClick={() => setShowAddSlot(false)} className="p-2 rounded-lg hover:bg-surface/50 text-text-secondary"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Date</label>
                    <input type="date" min={todayIso} value={slotDate} onChange={e => setSlotDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Start Time</label>
                    <input type="time" value={slotTime} onChange={e => setSlotTime(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                  </div>
                  <p className="text-xs text-text-secondary">Duration: {doctor?.consultation_duration_minutes || 30} min</p>
                  <div className="flex gap-3 pt-2">
                    <GradientButton onClick={handleAddSlot} disabled={slotSaving || !slotDate} className="flex-1 justify-center">{slotSaving ? 'Saving…' : 'Add Slot'}</GradientButton>
                    <button onClick={() => setShowAddSlot(false)} className="px-6 py-3 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary font-medium transition-all">Cancel</button>
                  </div>
                </div>
              </NeumorphCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Generate Modal */}
      <AnimatePresence>
        {showQuickGen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowQuickGen(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg">
              <NeumorphCard>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Quick Generate Slots</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Create time slots for a date range in one click</p>
                  </div>
                  <button onClick={() => setShowQuickGen(false)} className="p-2 rounded-lg hover:bg-surface/50 text-text-secondary"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-primary" /> Start Date</label>
                      <input type="date" min={todayIso} value={qgStartDate} onChange={e => setQgStartDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1.5 flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-primary" /> End Date</label>
                      <input type="date" min={qgStartDate} value={qgEndDate} onChange={e => setQgEndDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                    </div>
                  </div>

                  {/* Shift 1 */}
                  <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
                    <p className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5"><Sun className="w-3.5 h-3.5 text-warning" /> Morning Shift</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Start</label>
                        <input type="time" value={qgShift1Start} onChange={e => setQgShift1Start(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">End</label>
                        <input type="time" value={qgShift1End} onChange={e => setQgShift1End(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Shift 2 toggle */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" checked={qgUseShift2} onChange={e => setQgUseShift2(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                      <span className="text-sm font-medium text-text-primary flex items-center gap-1.5"><Moon className="w-3.5 h-3.5 text-primary" /> Include Evening Shift</span>
                    </label>
                  </div>

                  {qgUseShift2 && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs font-semibold text-text-primary mb-2 flex items-center gap-1.5"><Moon className="w-3.5 h-3.5 text-primary" /> Evening Shift</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">Start</label>
                          <input type="time" value={qgShift2Start} onChange={e => setQgShift2Start(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-text-secondary mb-1">End</label>
                          <input type="time" value={qgShift2End} onChange={e => setQgShift2End(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1.5">Slot Duration</label>
                    <select value={qgDuration} onChange={e => setQgDuration(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm">
                      {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                    </select>
                  </div>

                  {/* Preview */}
                  {qgStartDate && qgEndDate && (
                    <div className="p-3 rounded-xl bg-success/5 border border-success/20 text-xs text-success">
                      Will generate slots for <span className="font-semibold">{Math.max(0, Math.round((new Date(qgEndDate).getTime() - new Date(qgStartDate).getTime()) / 86400000) + 1)} days</span> ({qgStartDate} → {qgEndDate}), skipping already-existing slots.
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleQuickGenerate}
                      disabled={qgSaving || !qgStartDate || !qgEndDate}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {qgSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Slots</>}
                    </button>
                    <button onClick={() => setShowQuickGen(false)} className="px-6 py-3 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary font-medium text-sm transition-all">Cancel</button>
                  </div>
                </div>
              </NeumorphCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Schedule Modal */}
      <AnimatePresence>
        {showAddSchedule && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddSchedule(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg">
              <NeumorphCard>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-text-primary">{editSchedule ? 'Edit Schedule' : 'Add Schedule'}</h3>
                  <button onClick={() => { setShowAddSchedule(false); setEditSchedule(null); }} className="p-2 rounded-lg hover:bg-surface/50 text-text-secondary"><X className="w-5 h-5" /></button>
                </div>
                {schError && <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm mb-4">{schError}</div>}
                <form onSubmit={handleSchSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-1">
                      <CalendarDays className="w-4 h-4 text-primary" /> Schedule Date
                    </label>
                    <input type="date" value={schForm.schedule_date} onChange={e => setSchForm(p => ({ ...p, schedule_date: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                  </div>

                  {/* Shift 1 */}
                  <div className="p-3 rounded-xl bg-primary/5">
                    <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1">
                      <Sun className="w-4 h-4 text-warning" /> Shift 1 (Morning)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Start</label>
                        <input type="time" value={schForm.shift1_start} onChange={e => setSchForm(p => ({ ...p, shift1_start: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">End</label>
                        <input type="time" value={schForm.shift1_end} onChange={e => setSchForm(p => ({ ...p, shift1_end: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Shift 2 */}
                  <div className="p-3 rounded-xl bg-surface shadow-neumorph-inset">
                    <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-1">
                      <Moon className="w-4 h-4 text-primary" /> Shift 2 (Evening)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">Start</label>
                        <input type="time" value={schForm.shift2_start} onChange={e => setSchForm(p => ({ ...p, shift2_start: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-text-secondary mb-1">End</label>
                        <input type="time" value={schForm.shift2_end} onChange={e => setSchForm(p => ({ ...p, shift2_end: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">Leave empty if no second shift.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Slot Duration</label>
                    <select value={schForm.slot_duration_minutes} onChange={e => setSchForm(p => ({ ...p, slot_duration_minutes: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm">
                      {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} minutes</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="is_active" checked={schForm.is_active} onChange={e => setSchForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
                    <label htmlFor="is_active" className="text-sm text-text-primary">Active (generates slots)</label>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <GradientButton type="submit" disabled={schSaving} className="flex-1 justify-center">{schSaving ? 'Saving…' : editSchedule ? 'Update Schedule' : 'Add Schedule'}</GradientButton>
                    <button type="button" onClick={() => { setShowAddSchedule(false); setEditSchedule(null); }} className="px-6 py-3 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary font-medium transition-all">Cancel</button>
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
