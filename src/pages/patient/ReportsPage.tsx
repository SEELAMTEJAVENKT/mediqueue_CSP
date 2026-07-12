import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, FileText, CheckCircle, AlertTriangle, XCircle,
  ScanLine, TrendingUp, Heart, Droplets, Activity, Plus, Loader2,
  Stethoscope, AlertCircle, Pill, CalendarDays, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { GradientButton } from '../../components/ui/GradientButton';
import { supabase } from '../../lib/supabase';

interface LabResult {
  name: string;
  value: string;
  unit?: string;
  normal_range?: string;
  status?: 'normal' | 'low' | 'high';
  purpose?: string;
  explanation?: string;
}

interface Prescription {
  id: string;
  diagnosis: string | null;
  instructions: string | null;
  follow_up_date: string | null;
  medicines: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    purpose?: string;
    instructions?: string;
  }>;
}

interface MedicalReport {
  id: string;
  title: string;
  report_type: string;
  file_name: string | null;
  notes: string | null;
  health_status: string | null;
  created_at: string;
  appointment_id: string | null;
  doctor_id: string | null;
  diagnosis?: string | null;
  plain_explanation?: string | null;
  symptoms_observed?: string | null;
  doctor_findings?: string | null;
  lab_results?: LabResult[] | null;
  recommended_actions?: string | null;
  follow_up_instructions?: string | null;
  follow_up_date?: string | null;
  ai_summary?: string | null;
  appointments?: { date: string; status?: string; doctors?: { name: string } | null } | null;
  prescriptions?: Prescription[] | null;
}

export function ReportsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const patientId = user?.id;

  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MedicalReport | null>(null);

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('lab_report');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadError, setUploadError] = useState('');

  const fetchReports = useCallback(async () => {
    if (!patientId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('medical_reports')
      .select(`
        id, title, report_type, file_name, notes, health_status, created_at,
        appointment_id, doctor_id,
        diagnosis, plain_explanation, symptoms_observed, doctor_findings,
        lab_results, recommended_actions, follow_up_instructions, follow_up_date, ai_summary,
        appointments ( date, status, doctors ( name ) ),
        prescriptions ( id, diagnosis, instructions, follow_up_date, medicines )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Show reports only if appointment is COMPLETED or REPORT_READY
      const visible = (data as any[]).filter(r =>
        r.appointments && ['completed', 'report_ready'].includes(r.appointments.status)
      );
      setReports(visible as any);
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadFileName(file.name);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadFileName(file.name);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    if (!uploadTitle.trim()) { setUploadError('Title is required'); return; }
    setUploading(true);
    setUploadError('');
    const { data, error } = await supabase.from('medical_reports').insert({
      patient_id: patientId,
      title: uploadTitle.trim(),
      report_type: uploadType,
      file_name: uploadFileName || null,
      notes: uploadNotes || null,
      health_status: 'normal',
    }).select().single();

    if (error) { setUploadError(error.message); setUploading(false); return; }
    setReports(prev => [data as MedicalReport, ...prev]);
    setSelected(data as MedicalReport);
    setShowUpload(false);
    setUploadTitle(''); setUploadType('lab_report'); setUploadNotes(''); setUploadFileName('');
    setUploading(false);
  };

  const statusColor: Record<string, string> = {
    normal: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    critical: 'text-danger bg-danger/10',
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{t('nav.reports')}</h1>
          <p className="text-text-secondary mt-1">Your medical reports and health records</p>
        </div>
        <GradientButton onClick={() => setShowUpload(true)}>
          <Plus className="w-4 h-4" /> Add Report
        </GradientButton>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Report List */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
          <NeumorphCard className="h-full">
            <h3 className="text-lg font-bold text-text-primary mb-4">Medical Reports</h3>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-surface shadow-neumorph-inset flex items-center justify-center mb-4">
                  <ScanLine className="w-8 h-8 text-text-secondary" />
                </div>
                <h4 className="font-semibold text-text-primary mb-2">No reports available yet</h4>
                <p className="text-sm text-text-secondary max-w-xs mb-4">
                  Reports will appear after your consultation is completed.
                </p>
                <GradientButton onClick={() => setShowUpload(true)}>
                  <Plus className="w-4 h-4" /> Upload Report
                </GradientButton>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => setSelected(report)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      selected?.id === report.id
                        ? 'bg-primary/10 ring-1 ring-primary/30'
                        : 'bg-surface shadow-neumorph-inset hover:shadow-neumorph'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{report.title}</p>
                      <p className="text-xs text-text-secondary">
                        {formatDate(report.created_at)}
                        {(report.appointments as any)?.doctors?.name && ` · Dr. ${(report.appointments as any).doctors.name}`}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[report.health_status || 'normal'] || statusColor.normal}`}>
                      {(report.health_status || 'normal').charAt(0).toUpperCase() + (report.health_status || 'normal').slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </NeumorphCard>
        </motion.div>

        {/* Report Detail / Upload Panel */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
          {showUpload ? (
            <NeumorphCard>
              <h3 className="text-lg font-bold text-text-primary mb-4">Upload Medical Report</h3>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                {uploadError && <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm">{uploadError}</div>}

                {/* File drop zone */}
                <div
                  onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDragging ? 'border-primary bg-primary/5' :
                    uploadFileName ? 'border-success bg-success/5' :
                    'border-slate-300 hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <input id="file-input" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileInput} />
                  {uploadFileName ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-8 h-8 text-success mx-auto" />
                      <p className="text-sm font-medium text-text-primary">{uploadFileName}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-primary mx-auto" />
                      <p className="text-sm font-semibold text-text-primary">Drop file here or click to browse</p>
                      <p className="text-xs text-text-secondary">PDF, JPG, PNG supported</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1.5">Report Title *</label>
                  <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="e.g. Blood Test — June 2026" className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset text-text-primary text-sm outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1.5">Report Type</label>
                  <select value={uploadType} onChange={e => setUploadType(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset text-text-primary text-sm outline-none">
                    <option value="lab_report">Lab Report</option>
                    <option value="prescription">Prescription</option>
                    <option value="scan">Scan / X-Ray</option>
                    <option value="discharge_summary">Discharge Summary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1.5">Notes (optional)</label>
                  <textarea rows={3} value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} placeholder="Any additional notes..." className="w-full px-4 py-3 rounded-xl bg-surface shadow-neumorph-inset text-text-primary text-sm outline-none resize-none" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowUpload(false)} className="flex-1 px-4 py-3 rounded-xl bg-surface shadow-neumorph text-text-secondary text-sm font-medium hover:text-text-primary">
                    Cancel
                  </button>
                  <GradientButton type="submit" disabled={uploading} className="flex-1 justify-center">
                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Report'}
                  </GradientButton>
                </div>
              </form>
            </NeumorphCard>
          ) : selected ? (
            <NeumorphCard className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{selected.title}</h3>
                  <p className="text-xs text-text-secondary mt-1">
                    {formatDate(selected.created_at)} · {selected.report_type.replace('_', ' ')}
                    {(selected.appointments as any)?.doctors?.name && ` · Dr. ${(selected.appointments as any).doctors.name}`}
                  </p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[selected.health_status || 'normal'] || statusColor.normal}`}>
                  {(selected.health_status || 'normal').charAt(0).toUpperCase() + (selected.health_status || 'normal').slice(1)}
                </span>
              </div>

              {selected.file_name && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm text-text-primary">{selected.file_name}</span>
                </div>
              )}

              {selected.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-2">Notes</h4>
                  <p className="text-sm text-text-secondary leading-relaxed">{selected.notes}</p>
                </div>
              )}

              {/* Metric cards — shown as reference UI */}
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-3">Health Indicators</h4>
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard icon={TrendingUp} label={t('aiScanner.bp')} value="—" status="normal" />
                  <MetricCard icon={Droplets} label={t('aiScanner.sugar')} value="—" status="normal" />
                  <MetricCard icon={Activity} label={t('aiScanner.cholesterol')} value="—" status="normal" />
                  <MetricCard icon={Heart} label="Heart Rate" value="—" status="normal" />
                </div>
              </div>

              {/* Patient-friendly summary sections */}
              <div className="space-y-6 mt-4">
                {/* AI-assisted summary */}
                {selected.ai_summary && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h4 className="text-sm font-semibold text-primary">Your Health Summary (AI-assisted)</h4>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{selected.ai_summary}</p>
                  </div>
                )}

                {/* 1. Diagnosis */}
                {selected.diagnosis && (
                  <Section title="Diagnosis" icon={Stethoscope}>
                    <p className="text-sm font-medium text-text-primary mb-1">{selected.diagnosis}</p>
                    {selected.plain_explanation && (
                      <p className="text-sm text-text-secondary leading-relaxed">{selected.plain_explanation}</p>
                    )}
                  </Section>
                )}

                {/* 2. Symptoms Observed */}
                {selected.symptoms_observed && (
                  <Section title="Symptoms Observed" icon={AlertCircle}>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{selected.symptoms_observed}</p>
                  </Section>
                )}

                {/* 3. Doctor's Findings */}
                {selected.doctor_findings && (
                  <Section title="Doctor's Findings" icon={FileText}>
                    <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{selected.doctor_findings}</p>
                  </Section>
                )}

                {/* 4. Prescribed Medicines */}
                {selected.prescriptions && selected.prescriptions.length > 0 && (
                  <Section title="Prescribed Medicines" icon={Pill}>
                    <div className="space-y-4">
                      {(selected.prescriptions || []).flatMap((p, pi) =>
                        (p.medicines || []).map((m, mi) => (
                          <div key={`${pi}-${mi}`} className="p-3 rounded-xl bg-surface shadow-neumorph-inset">
                            <p className="text-sm font-semibold text-text-primary">{m.name}</p>
                            {m.purpose && (
                              <p className="text-xs text-text-secondary mt-1"><span className="font-medium">Purpose:</span> {m.purpose}</p>
                            )}
                            <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-text-secondary">
                              {m.dosage && <div><span className="font-medium text-text-primary">Dosage:</span><br />{m.dosage}</div>}
                              {m.frequency && <div><span className="font-medium text-text-primary">Frequency:</span><br />{m.frequency}</div>}
                              {m.duration && <div><span className="font-medium text-text-primary">Duration:</span><br />{m.duration}</div>}
                            </div>
                            {m.instructions && (
                              <p className="text-xs text-warning mt-2"><span className="font-medium">Precaution:</span> {m.instructions}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </Section>
                )}

                {/* 5. Lab Reports */}
                {selected.lab_results && selected.lab_results.length > 0 && (
                  <Section title="Lab Reports" icon={Activity}>
                    <div className="space-y-3">
                      {selected.lab_results.map((lab, li) => {
                        const statusCls = lab.status === 'high' ? 'text-danger' : lab.status === 'low' ? 'text-warning' : 'text-success';
                        return (
                          <div key={li} className="p-3 rounded-xl bg-surface shadow-neumorph-inset">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-text-primary">{lab.name}</p>
                              <span className={`text-xs font-medium ${statusCls}`}>
                                {lab.status ? lab.status.toUpperCase() : 'NORMAL'}
                              </span>
                            </div>
                            <p className="text-sm text-text-primary mt-1">
                              Result: <span className="font-medium">{lab.value}{lab.unit ? ` ${lab.unit}` : ''}</span>
                            </p>
                            {lab.normal_range && (
                              <p className="text-xs text-text-secondary">Normal range: {lab.normal_range}</p>
                            )}
                            {lab.explanation && (
                              <p className="text-xs text-text-secondary mt-1 italic">{lab.explanation}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                )}

                {/* 6. Recommended Actions */}
                {selected.recommended_actions && (
                  <Section title="Recommended Actions" icon={CheckCircle}>
                    <ul className="space-y-1.5">
                      {selected.recommended_actions.split('\n').filter(Boolean).map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                          <CheckCircle className="w-3.5 h-3.5 text-success mt-0.5 flex-shrink-0" />
                          {a.replace(/^[\-•*]\s*/, '')}
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {/* 7. Follow-Up Information */}
                {(selected.follow_up_date || selected.follow_up_instructions || (selected.prescriptions || []).some(p => p.follow_up_date)) && (
                  <Section title="Follow-Up Information" icon={CalendarDays}>
                    {(selected.follow_up_date || (selected.prescriptions || [])[0]?.follow_up_date) && (
                      <p className="text-sm text-text-primary mb-1">
                        <span className="font-medium">Next appointment:</span>{' '}
                        {formatDate(selected.follow_up_date || (selected.prescriptions || [])[0]?.follow_up_date || '')}
                      </p>
                    )}
                    {selected.follow_up_instructions && (
                      <p className="text-sm text-text-secondary leading-relaxed">{selected.follow_up_instructions}</p>
                    )}
                  </Section>
                )}

                {/* Disclaimer */}
                <div className="p-3 rounded-xl bg-warning/5 border border-warning/20">
                  <p className="text-xs text-text-secondary italic">
                    This summary is provided for informational purposes and does not replace professional medical advice.
                  </p>
                </div>
              </div>
            </NeumorphCard>
          ) : (
            <NeumorphCard className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className="w-20 h-20 rounded-full bg-surface shadow-neumorph-inset flex items-center justify-center mb-6">
                <ScanLine className="w-10 h-10 text-text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Select a Report</h3>
              <p className="text-sm text-text-secondary max-w-xs">
                Choose a report from the list or add a new one to view details
              </p>
            </NeumorphCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, status }: { icon: typeof TrendingUp; label: string; value: string; status: 'normal' | 'warning' | 'critical' }) {
  const statusColors = { normal: 'text-success bg-success/10', warning: 'text-warning bg-warning/10', critical: 'text-danger bg-danger/10' };
  return (
    <div className="p-4 rounded-xl bg-surface shadow-neumorph-inset">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-text-secondary" />
        <span className="text-xs text-text-secondary">{label}</span>
      </div>
      <p className="text-lg font-bold text-text-primary">{value}</p>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-2 ${statusColors[status]}`}>
        {status === 'normal' ? <CheckCircle className="w-3 h-3 mr-1" /> : status === 'warning' ? <AlertTriangle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
      </div>
      {children}
    </div>
  );
}
