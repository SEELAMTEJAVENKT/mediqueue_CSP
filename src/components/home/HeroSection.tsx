import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CalendarPlus, Upload, MapPin, Bot, ChevronRight, Shield, Clock, Users } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

export function HeroSection() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();

  const quickActions = [
    { icon: CalendarPlus, label: 'hero.bookAppointment', path: '/appointments', color: 'from-primary to-primary-dark' },
    { icon: Upload, label: 'hero.uploadReport', path: '/reports', color: 'from-secondary to-secondary-dark' },
    { icon: MapPin, label: 'hero.findHospital', path: '/hospitals', color: 'from-warning to-orange-500' },
  ];

  const stats = [
    { icon: Users, value: '50,000+', label: 'Patients Served' },
    { icon: Shield, value: '500+', label: 'Verified Doctors' },
    { icon: Clock, value: '24/7', label: 'AI Support' },
  ];

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Bot className="w-4 h-4" />
              AI-Powered Healthcare Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
              {t('hero.title')}
              <span className="block gradient-text mt-2">Smarter Care, Better Health</span>
            </h1>

            <p className="text-lg text-text-secondary leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                to={isAuthenticated ? '/appointments' : '/register'}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary-dark text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <CalendarPlus className="w-5 h-5" />
                {t('hero.bookAppointment')}
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/symptom-checker"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-surface text-text-primary font-semibold shadow-neumorph hover:shadow-neumorph-hover hover:-translate-y-0.5 transition-all"
              >
                <Bot className="w-5 h-5 text-primary" />
                Check Symptoms
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                    <p className="text-xs text-text-secondary">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Quick Actions Grid */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="grid grid-cols-2 gap-4"
          >
            {quickActions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <Link
                  to={action.path}
                  className="group block p-6 rounded-3xl bg-surface shadow-neumorph hover:shadow-neumorph-hover hover:-translate-y-1 transition-all duration-300 h-full"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {t(action.label)}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-text-secondary mt-2 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            ))}

            {/* AI Assistant card — opens the floating chatbot */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openChatbot'))}
                className="group block w-full text-left p-6 rounded-3xl bg-surface shadow-neumorph hover:shadow-neumorph-hover hover:-translate-y-1 transition-all duration-300 h-full"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {t('hero.aiAssistant')}
                </h3>
                <ChevronRight className="w-4 h-4 text-text-secondary mt-2 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </button>
            </motion.div>

            {/* Decorative Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="col-span-2 p-6 rounded-3xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Your Health is Secure</h3>
                  <p className="text-sm text-text-secondary">End-to-end encrypted data with AI-powered insights</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
