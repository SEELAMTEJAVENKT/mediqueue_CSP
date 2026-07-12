import { supabase } from '../lib/supabase';

export interface ScheduleRow {
  id: string;
  doctor_id: string;
  hospital_id: string;
  schedule_date: string;
  shift1_start: string;
  shift1_end: string;
  shift2_start: string | null;
  shift2_end: string | null;
  slot_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function useSchedules(doctorId?: string, hospitalId?: string) {
  const list = async (): Promise<ScheduleRow[]> => {
    let q = supabase.from('schedules').select('*');
    if (doctorId) q = q.eq('doctor_id', doctorId);
    if (hospitalId) q = q.eq('hospital_id', hospitalId);
    const { data, error } = await q.order('schedule_date', { ascending: true });
    if (error) throw error;
    return (data || []) as ScheduleRow[];
  };

  const create = async (row: Omit<ScheduleRow, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('schedules').insert(row as any).select().single();
    if (error) throw error;
    return data as ScheduleRow;
  };

  const update = async (id: string, updates: Partial<ScheduleRow>) => {
    const { data, error } = await supabase.from('schedules').update(updates as any).eq('id', id).select().single();
    if (error) throw error;
    return data as ScheduleRow;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) throw error;
  };

  /**
   * Generate time_slots rows based on the doctor's active schedules.
   * For each active schedule, insert slots for its specific date using shift times.
   * Skips duplicates (same doctor_id + date + start_time).
   */
  const generateSlots = async (doctorId: string, hospitalId: string) => {
    const schedules = (await list()).filter(s => s.doctor_id === doctorId && s.is_active);
    if (schedules.length === 0) {
      return { created: 0, message: 'No active schedules found. Add a schedule first.' };
    }

    // Pull existing slots to dedupe
    const { data: existing } = await supabase
      .from('time_slots')
      .select('id, date, start_time')
      .eq('doctor_id', doctorId);

    const existingSet = new Set(
      (existing || []).map((r: any) => `${r.date}|${r.start_time}`)
    );

    const newRows: any[] = [];

    for (const s of schedules) {
      const dateStr = s.schedule_date;
      const dur = s.slot_duration_minutes || 30;

      // Process shift 1
      if (s.shift1_start && s.shift1_end) {
        const startMins = parseTime(s.shift1_start);
        const endMins = parseTime(s.shift1_end);
        for (let m = startMins; m + dur <= endMins; m += dur) {
          const slotStart = formatTime(m);
          const slotEnd = formatTime(m + dur);
          const key = `${dateStr}|${slotStart}`;
          if (existingSet.has(key)) continue;
          existingSet.add(key);
          newRows.push({
            doctor_id: doctorId,
            hospital_id: hospitalId,
            date: dateStr,
            start_time: slotStart,
            end_time: slotEnd,
            is_booked: false,
            is_locked: false,
            status: 'AVAILABLE',
          });
        }
      }

      // Process shift 2
      if (s.shift2_start && s.shift2_end) {
        const startMins = parseTime(s.shift2_start);
        const endMins = parseTime(s.shift2_end);
        for (let m = startMins; m + dur <= endMins; m += dur) {
          const slotStart = formatTime(m);
          const slotEnd = formatTime(m + dur);
          const key = `${dateStr}|${slotStart}`;
          if (existingSet.has(key)) continue;
          existingSet.add(key);
          newRows.push({
            doctor_id: doctorId,
            hospital_id: hospitalId,
            date: dateStr,
            start_time: slotStart,
            end_time: slotEnd,
            is_booked: false,
            is_locked: false,
            status: 'AVAILABLE',
          });
        }
      }
    }

    if (newRows.length === 0) {
      return { created: 0, message: 'All slots already generated for the selected schedules.' };
    }

    const { error } = await supabase.from('time_slots').insert(newRows);
    if (error) throw error;

    return { created: newRows.length, message: `${newRows.length} new slots generated across ${schedules.length} active schedules.` };
  };

  return { list, create, update, remove, generateSlots };
}
