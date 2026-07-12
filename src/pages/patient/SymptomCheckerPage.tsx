import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Send, CheckCircle, AlertTriangle, XCircle, Stethoscope, RotateCcw, Mic } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { NeumorphCard } from '../../components/ui/NeumorphCard';
import { GradientButton } from '../../components/ui/GradientButton';

interface SymptomResult {
  urgency: 'low' | 'medium' | 'high';
  possibleConditions: string[];
  recommendedSpecialist: string;
  advice: string;
  shouldSeeDoctor: boolean;
}

export function SymptomCheckerPage() {
  const { t } = useLanguage();
  const [symptom, setSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomResult | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);

  const handleCheck = async () => {
    if (!symptom.trim()) return;
    setLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', text: symptom }]);

    // Simulate AI response
    setTimeout(() => {
      const lowerSymptom = symptom.toLowerCase();
      let response: SymptomResult;

      if (lowerSymptom.includes('chest') || lowerSymptom.includes('heart')) {
        response = {
          urgency: 'high',
          possibleConditions: ['Angina', 'Heart Attack', 'Costochondritis', 'Anxiety'],
          recommendedSpecialist: 'Cardiologist',
          advice: 'Chest pain can be serious. If you experience severe chest pain, shortness of breath, or pain radiating to your arm, seek emergency care immediately.',
          shouldSeeDoctor: true,
        };
      } else if (lowerSymptom.includes('head') || lowerSymptom.includes('migraine')) {
        response = {
          urgency: 'medium',
          possibleConditions: ['Tension Headache', 'Migraine', 'Sinusitis', 'Cluster Headache'],
          recommendedSpecialist: 'Neurologist',
          advice: 'Most headaches are not serious, but persistent or severe headaches should be evaluated by a doctor.',
          shouldSeeDoctor: true,
        };
      } else if (lowerSymptom.includes('fever') || lowerSymptom.includes('cold')) {
        response = {
          urgency: 'low',
          possibleConditions: ['Common Cold', 'Influenza', 'Viral Infection'],
          recommendedSpecialist: 'General Physician',
          advice: 'Rest, stay hydrated, and monitor your temperature. See a doctor if fever persists beyond 3 days or exceeds 103F.',
          shouldSeeDoctor: false,
        };
      } else if (lowerSymptom.includes('skin') || lowerSymptom.includes('rash')) {
        response = {
          urgency: 'low',
          possibleConditions: ['Allergic Reaction', 'Eczema', 'Contact Dermatitis'],
          recommendedSpecialist: 'Dermatologist',
          advice: 'Avoid scratching and identify potential triggers. See a dermatologist if the rash persists or spreads.',
          shouldSeeDoctor: false,
        };
      } else {
        response = {
          urgency: 'medium',
          possibleConditions: ['General Infection', 'Stress-related condition', 'Requires further evaluation'],
          recommendedSpecialist: 'General Physician',
          advice: 'Your symptoms require further evaluation. Please consult a general physician for proper diagnosis.',
          shouldSeeDoctor: true,
        };
      }

      setResult(response);
      setChatHistory(prev => [...prev, { role: 'assistant', text: response.advice }]);
      setLoading(false);
      setSymptom('');
    }, 1500);
  };

  const urgencyConfig = {
    low: { color: 'text-success bg-success/10', icon: CheckCircle, label: t('symptom.urgency.low') },
    medium: { color: 'text-warning bg-warning/10', icon: AlertTriangle, label: t('symptom.urgency.medium') },
    high: { color: 'text-danger bg-danger/10', icon: XCircle, label: t('symptom.urgency.high') },
  };

  const reset = () => {
    setResult(null);
    setChatHistory([]);
    setSymptom('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{t('symptom.title')}</h1>
        <p className="text-text-secondary mt-1">Describe your symptoms and get AI-guided health assessment</p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-2">
          <NeumorphCard className="h-[500px] flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {chatHistory.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-primary/30 mx-auto mb-4" />
                  <p className="text-text-secondary text-sm">Describe your symptoms to get started</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {['I have chest pain', 'Headache for 2 days', 'Skin rash on arm', 'Fever and cough'].map(s => (
                      <button
                        key={s}
                        onClick={() => setSymptom(s)}
                        className="px-3 py-1.5 rounded-lg bg-surface shadow-neumorph text-xs text-text-secondary hover:text-primary transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white rounded-br-md'
                      : 'bg-surface shadow-neumorph-inset text-text-primary rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-surface shadow-neumorph-inset text-text-primary rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={symptom}
                  onChange={e => setSymptom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCheck()}
                  placeholder={t('symptom.describe')}
                  className="w-full pl-4 pr-10 py-3 rounded-xl bg-surface shadow-neumorph-inset border-none outline-none text-text-primary text-sm"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary">
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <GradientButton onClick={handleCheck} disabled={!symptom.trim() || loading}>
                <Send className="w-4 h-4" />
              </GradientButton>
            </div>
          </NeumorphCard>
        </div>

        {/* Result Panel */}
        <div>
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <NeumorphCard className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-text-primary">{t('symptom.result')}</h3>
                    <button onClick={reset} className="p-1.5 rounded-lg hover:bg-surface/50 text-text-secondary">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Urgency */}
                  <div className={`p-4 rounded-xl ${urgencyConfig[result.urgency].color}`}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = urgencyConfig[result.urgency].icon;
                        return <Icon className="w-5 h-5" />;
                      })()}
                      <span className="font-semibold">{urgencyConfig[result.urgency].label}</span>
                    </div>
                  </div>

                  {/* Conditions */}
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-2">Possible Conditions</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.possibleConditions.map((c, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Specialist */}
                  <div className="p-3 rounded-xl bg-secondary/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-text-secondary">Recommended</span>
                    </div>
                    <p className="text-sm font-bold text-text-primary">{result.recommendedSpecialist}</p>
                  </div>

                  {/* Action */}
                  {result.shouldSeeDoctor && (
                    <div className="p-3 rounded-xl bg-danger/10 text-danger text-sm">
                      Please consult a doctor for proper diagnosis and treatment.
                    </div>
                  )}
                </NeumorphCard>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && (
            <NeumorphCard className="h-full flex flex-col items-center justify-center text-center p-8">
              <Activity className="w-10 h-10 text-text-secondary/50 mb-3" />
              <p className="text-sm text-text-secondary">Your assessment will appear here</p>
            </NeumorphCard>
          )}
        </div>
      </div>
    </div>
  );
}
