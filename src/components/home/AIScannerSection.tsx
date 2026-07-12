import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, ScanLine, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../ui/NeumorphCard';
import { StatusBadge } from '../ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { MedicalReport } from '../../types';

export function AIScannerSection() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [report, setReport] = useState<MedicalReport | null>(null);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('medical_reports')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const r = data as any;
        setReport({
          id: r.id,
          patientId: r.patient_id,
          fileName: r.file_name || 'report',
          fileUrl: r.file_url || '#',
          fileType: r.file_type || 'pdf',
          uploadedAt: r.uploaded_at || r.created_at,
          aiAnalysis: r.ai_analysis,
          extractedData: r.extracted_data,
        });
      }
    })();
  }, [user]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload();
  }, []);

  const handleUpload = () => {
    setUploaded(true);
    setAnalyzing(true);
    setUploadError('');
    setTimeout(() => {
      setAnalyzing(false);
      if (report?.aiAnalysis) {
        setShowResults(true);
      } else {
        setUploadError('No AI analysis available for your latest report. Book a consultation to get an analyzed report.');
      }
    }, 1500);
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-emerald-600 text-sm font-medium mb-4">
            <ScanLine className="w-4 h-4" />
            AI Powered
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            {t('aiScanner.title')}
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto">
            {t('aiScanner.subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <NeumorphCard className="h-full">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleUpload}
                className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : uploaded
                    ? 'border-success bg-success/5'
                    : 'border-slate-300 hover:border-primary hover:bg-primary/5'
                }`}
              >
                {uploaded ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <p className="text-lg font-semibold text-text-primary">blood_test_report.pdf</p>
                    <p className="text-sm text-text-secondary">Uploaded successfully</p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-lg font-semibold text-text-primary">{t('aiScanner.upload')}</p>
                    <p className="text-sm text-text-secondary">{t('aiScanner.supported')}</p>
                  </div>
                )}

                {analyzing && (
                  <div className="absolute inset-0 bg-surface/90 rounded-2xl flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-sm font-medium text-text-primary">{t('aiScanner.analyzing')}</p>
                  </div>
                )}
              </div>
            </NeumorphCard>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {showResults && report?.aiAnalysis ? (
              <NeumorphCard className="h-full space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-text-primary">{t('aiScanner.results')}</h3>
                  <StatusBadge status={report.aiAnalysis.healthStatus} />
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-sm text-text-primary leading-relaxed">{report.aiAnalysis.summary}</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard
                    icon={TrendingUp}
                    label={t('aiScanner.bp')}
                    value={`${report.extractedData?.bloodPressure?.systolic}/${report.extractedData?.bloodPressure?.diastolic}`}
                    status={report.extractedData?.bloodPressure?.systolic && report.extractedData.bloodPressure.systolic > 130 ? 'warning' : 'normal'}
                  />
                  <MetricCard
                    icon={TrendingUp}
                    label={t('aiScanner.sugar')}
                    value={`${report.extractedData?.bloodSugar?.fasting} mg/dL`}
                    status="normal"
                  />
                  <MetricCard
                    icon={TrendingUp}
                    label={t('aiScanner.cholesterol')}
                    value={`${report.extractedData?.bloodTest?.cholesterol} mg/dL`}
                    status={report.extractedData?.bloodTest?.cholesterol && report.extractedData.bloodTest.cholesterol > 200 ? 'warning' : 'normal'}
                  />
                  <MetricCard
                    icon={FileText}
                    label={t('aiScanner.bloodTest')}
                    value="View Details"
                    status="normal"
                  />
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {report.aiAnalysis.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Specialists */}
                <div className="p-4 rounded-xl bg-secondary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-sm font-semibold text-text-primary">Recommended Specialists</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.aiAnalysis.recommendedSpecialists.map((spec, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </NeumorphCard>
            ) : (
              <NeumorphCard className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 rounded-full bg-surface shadow-neumorph-inset flex items-center justify-center mb-6">
                  <ScanLine className="w-10 h-10 text-text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Upload a Report</h3>
                <p className="text-sm text-text-secondary max-w-xs">
                  Upload your medical report to see AI-powered analysis and health insights
                </p>
              </NeumorphCard>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, status }: { icon: typeof TrendingUp; label: string; value: string; status: 'normal' | 'warning' | 'critical' }) {
  const statusColors = {
    normal: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    critical: 'text-danger bg-danger/10',
  };

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
