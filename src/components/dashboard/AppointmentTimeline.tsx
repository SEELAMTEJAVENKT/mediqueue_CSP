import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarPlus, UserCheck, Stethoscope, CheckCircle,
  XCircle, FileText, Clock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Appointment } from '../../hooks/useAppointments';
import { cn } from '../../utils/cn';

interface TimelineEvent {
  label: string;
  time?: string | null;
  icon: typeof CalendarPlus;
  color: string;
  done: boolean;
  current?: boolean;
}

function fmt(ts?: string | null): string | null {
  if (!ts) return null;
  try { return new Date(ts).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }); }
  catch { return String(ts); }
}

function diffMins(a?: string | null, b?: string | null): number | null {
  if (!a || !b) return null;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));
}

export function AppointmentTimeline({ appointmentId }: { appointmentId: string }) {
  const [appt, setAppt] = useState<(Appointment & { rejection_reason?: string | null }) | null>(null);
  const [logs, setLogs] = useState<{ old_status: string | null; new_status: string; created_at: string; notes: string | null }[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();
    const { data: logData } = await supabase
      .from('appointment_audit_logs')
      .select('old_status, new_status, created_at, notes')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: true });
    setAppt(data as any);
    setLogs(logData as any || []);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [appointmentId]);

  if (!appt) {
    return <p className="text-sm text-text-secondary text-center py-4">Loading timeline…</p>;
  }

  const current = appt.status || 'pending';
  const isRejected = current === 'rejected';
  const isCancelled = ['cancelled', 'no_show', 'rescheduled'].includes(current);

  const events: TimelineEvent[] = [
    {
      label: 'Appointment Booked',
      time: appt.created_at,
      icon: CalendarPlus,
      color: 'bg-primary text-white',
      done: true,
    },
    {
      label: 'Doctor Approved',
      time: logs.find(l => l.new_status === 'confirmed')?.created_at || null,
      icon: CheckCircle,
      color: 'bg-primary text-white',
      done: ['confirmed', 'arrived', 'in_queue', 'in_progress', 'completed', 'report_ready'].includes(current),
      current: current === 'confirmed',
    },
    {
      label: 'Patient Arrived',
      time: appt.arrival_time,
      icon: UserCheck,
      color: 'bg-warning text-white',
      done: ['arrived', 'in_queue', 'in_progress', 'completed', 'report_ready'].includes(current),
      current: current === 'arrived' || current === 'in_queue',
    },
    {
      label: 'Consultation Started',
      time: appt.consultation_start,
      icon: Stethoscope,
      color: 'bg-secondary text-text-primary',
      done: ['in_progress', 'completed', 'report_ready'].includes(current),
      current: current === 'in_progress',
    },
    {
      label: 'Consultation Completed',
      time: appt.consultation_end,
      icon: CheckCircle,
      color: 'bg-success text-white',
      done: ['completed', 'report_ready'].includes(current),
      current: current === 'completed',
    },
    {
      label: 'Report Ready',
      time: logs.find(l => l.new_status === 'report_ready')?.created_at || null,
      icon: FileText,
      color: 'bg-primary text-white',
      done: current === 'report_ready',
      current: current === 'report_ready',
    },
  ];

  const waitingTime = appt.waiting_time_minutes ?? diffMins(appt.arrival_time, appt.consultation_start);
  const duration = appt.consultation_duration_minutes ?? diffMins(appt.consultation_start, appt.consultation_end);
  const queuePos = appt.queue_position;

  return (
    <div className="space-y-6">
      {/* Journey Stepper */}
      <div className="relative">
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-gradient-to-r from-primary to-success transition-all duration-500"
          style={{ width: `calc(${(events.filter(e => e.done).length / events.length) * 100}% - 1.25rem)` }}
        />
        <div className="relative flex justify-between">
          {events.map((ev, i) => {
            const Icon = ev.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-2"
                style={{ width: `${100 / events.length}%` }}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all',
                    ev.done ? ev.color : 'bg-surface shadow-neumorph text-text-secondary',
                    ev.current && 'ring-4 ring-primary/20'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className={cn('text-xs font-medium text-center', ev.done ? 'text-text-primary' : 'text-text-secondary')}>
                  {ev.label}
                </p>
                {ev.time && <p className="text-[10px] text-text-secondary">{fmt(ev.time)}</p>}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Rejected banner */}
      {isRejected && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-danger" />
            <p className="text-sm font-semibold text-danger">Appointment Rejected</p>
          </div>
          {appt.rejection_reason && (
            <p className="text-sm text-text-secondary mt-1">
              <span className="font-medium">Reason:</span> {appt.rejection_reason}
            </p>
          )}
        </div>
      )}

      {/* Is cancelled banner */}
      {isCancelled && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 text-danger text-sm">
          <XCircle className="w-4 h-4" />
          Appointment {current === 'no_show' ? 'marked as No-Show' : current}
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-surface shadow-neumorph-inset text-center">
          <p className="text-xs text-text-secondary">Queue Position</p>
          <p className="text-lg font-bold text-text-primary">{queuePos ? `#${queuePos}` : '—'}</p>
        </div>
        <div className="p-3 rounded-xl bg-surface shadow-neumorph-inset text-center">
          <p className="text-xs text-text-secondary">Waiting Time</p>
          <p className="text-lg font-bold text-text-primary">{waitingTime != null ? `${waitingTime} min` : '—'}</p>
        </div>
        <div className="p-3 rounded-xl bg-surface shadow-neumorph-inset text-center">
          <p className="text-xs text-text-secondary">Duration</p>
          <p className="text-lg font-bold text-text-primary">{duration != null ? `${duration} min` : '—'}</p>
        </div>
      </div>

      {/* Audit Log */}
      {logs.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">Status History</h4>
          <div className="space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {i < logs.length - 1 && <div className="w-0.5 flex-1 bg-slate-200" />}
                </div>
                <div className="flex-1 pb-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary capitalize">{log.new_status.replace('_', ' ')}</p>
                    {log.created_at && <p className="text-xs text-text-secondary">{fmt(log.created_at)}</p>}
                  </div>
                  {log.notes && <p className="text-xs text-text-secondary mt-0.5">{log.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
