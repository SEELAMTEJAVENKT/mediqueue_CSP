import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Save, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useAppointments } from '../../hooks/useAppointments';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { GradientButton } from '../../components/ui/GradientButton';

interface Medicine {
  name: string; dosage: string; frequency: string; duration: string;
}

function generatePlainExplanation(diagnosis: string, medicines: Medicine[], instructions: string): string {
  const parts: string[] = [];
  parts.push(`Your doctor has diagnosed you with ${diagnosis}.`);
  if (medicines.length > 0 && medicines.some(m => m.name)) {
    parts.push('You have been prescribed the following medicines:');
    medicines.filter(m => m.name).forEach(m => {
      const purpose = inferMedicinePurpose(m.name);
      const line = `- ${m.name}${m.dosage ? ` (${m.dosage})` : ''}: ${purpose}. Take ${m.frequency || 'as directed'} for ${m.duration || 'as directed'}.`;
      parts.push(line);
    });
  }
  if (instructions) {
    parts.push(`Additional advice from your doctor: ${instructions}`);
  }
  parts.push('Please follow the dosage schedule carefully. If you experience any side effects, contact your doctor immediately.');
  return parts.join('\n');
}

function inferMedicinePurpose(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('paracetamol') || n.includes('acetaminophen')) return 'Used to reduce fever and relieve pain';
  if (n.includes('ibuprofen') || n.includes('brufen')) return 'Used to reduce pain, inflammation, and fever';
  if (n.includes('amoxicillin') || n.includes('azithromycin') || n.includes('cephalexin')) return 'An antibiotic used to treat bacterial infections';
  if (n.includes('metformin')) return 'Used to control blood sugar levels in diabetes';
  if (n.includes('amlodipine') || n.includes('losartan')) return 'Used to lower high blood pressure';
  if (n.includes('atorvastatin') || n.includes('rosuvastatin')) return 'Used to lower cholesterol levels';
  if (n.includes('omeprazole') || n.includes('pantoprazole')) return 'Used to reduce stomach acid and treat acidity';
  if (n.includes('cetirizine') || n.includes('levocetirizine')) return 'Used to treat allergies and allergic reactions';
  if (n.includes('prednisolone') || n.includes('dexamethasone')) return 'A steroid used to reduce inflammation';
  if (n.includes('insulin')) return 'Used to control blood sugar levels';
  if (n.includes('salbutamol')) return 'Used to relieve breathing difficulties';
  if (n.includes('iron') || n.includes('folic acid')) return 'A nutritional supplement';
  return 'Take as prescribed by your doctor';
}

export function WritePrescriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const preselectApptId = (state as any)?.appointmentId as string | undefined;

  const { appointments } = useAppointments({ doctorId: user?.doctorId, hospitalId: user?.hospitalId });
  const confirmedAppts = appointments.filter(a => a.status === 'completed' || a.status === 'in_progress');

  const [apptId, setApptId] = useState(preselectApptId || '');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [instructions, setInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState('');

  const updateMed = (i: number, field: keyof Medicine, v: string) => {
    setMedicines(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: v } : m));
  };

  const addMed = () => setMedicines(p => [...p, { name: '', dosage: '', frequency: '', duration: '' }]);
  const rmMed = (i: number) => setMedicines(p => p.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!apptId || !diagnosis) { setSaved('Please select an appointment and enter diagnosis.'); return; }
    setSaving(true);
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) { setSaving(false); return; }
    try {
      // Save prescription
      const { data: rxData, error: rxErr } = await supabase.from('prescriptions').insert({
        appointment_id: appt.id,
        doctor_id: appt.doctor_id,
        patient_id: appt.patient_id,
        hospital_id: appt.hospital_id,
        diagnosis,
        medicines,
        instructions,
        follow_up_date: followUpDate || null,
      } as any).select().single();
      if (rxErr) throw rxErr;

      // Save medical report with patient-friendly explanation
      const plainExplanation = generatePlainExplanation(diagnosis, medicines, instructions);
      const { error: rptErr } = await supabase.from('medical_reports').insert({
        patient_id: appt.patient_id,
        appointment_id: appt.id,
        doctor_id: appt.doctor_id,
        hospital_id: appt.hospital_id,
        title: `Medical Report - ${diagnosis}`,
        report_type: 'consultation',
        diagnosis,
        plain_explanation: plainExplanation,
        doctor_findings: instructions,
        symptoms_observed: appt.symptoms || null,
        follow_up_date: followUpDate || null,
      } as any);
      if (rptErr) throw rptErr;

      // Link prescription to appointment and set status to report_ready
      await supabase.from('appointments').update({
        prescription_id: (rxData as any)?.id,
        status: 'report_ready',
        updated_at: new Date().toISOString(),
      } as any).eq('id', appt.id);

      setSaved('Prescription and report saved successfully!');
      setTimeout(() => navigate('/doctor'), 2000);
    } catch (err: any) {
      setSaved(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Write Prescription</h1>
        <p className="text-text-secondary mt-1">Generate a digital prescription for your patient</p>
      </motion.div>

      <NeumorphCard>
        <div className="space-y-5">
          {/* Appointment picker */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Patient / Appointment</label>
            <select value={apptId} onChange={e => setApptId(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm">
              <option value="">Select appointment…</option>
              {(confirmedAppts.length ? confirmedAppts : appointments).map(a => (
                <option key={a.id} value={a.id}>{a.patient_name || 'Patient'} · {a.date} {a.start_time}</option>
              ))}
            </select>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Diagnosis *</label>
            <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm"
              placeholder="e.g. Hypertension, Type 2 Diabetes..." />
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-text-primary">Medicines</label>
              <button onClick={addMed} className="flex items-center gap-1 text-xs text-primary hover:underline">
                <Plus className="w-3 h-3" /> Add Medicine
              </button>
            </div>
            {medicines.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-2">
                <input value={m.name} onChange={e => updateMed(i, 'name', e.target.value)} placeholder="Name" className="px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                <input value={m.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} placeholder="Dosage" className="px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                <input value={m.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} placeholder="Frequency" className="px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                <input value={m.duration} onChange={e => updateMed(i, 'duration', e.target.value)} placeholder="Duration" className="px-3 py-2 rounded-lg bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
                <button onClick={() => rmMed(i)} className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Instructions / Advice</label>
            <textarea rows={3} value={instructions} onChange={e => setInstructions(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm resize-none"
              placeholder="Follow-up advice, diet restrictions, lifestyle changes..." />
          </div>

          {/* Follow Up */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Follow-Up Date</label>
            <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm" />
          </div>

          {saved && (
            <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${saved.includes('success') ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {saved.includes('success') ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {saved}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <GradientButton onClick={save} disabled={saving} className="flex-1 justify-center">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Prescription'}
            </GradientButton>
            <button onClick={() => navigate('/doctor')} className="px-6 py-3 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary font-medium transition-all">
              Cancel
            </button>
          </div>
        </div>
      </NeumorphCard>
    </div>
  );
}
