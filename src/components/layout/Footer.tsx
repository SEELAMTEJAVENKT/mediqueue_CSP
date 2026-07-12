import { Link } from 'react-router-dom';
import { Stethoscope, Heart, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative mt-20">
      {/* Medical Disclaimer Banner */}
      <div className="bg-gradient-to-r from-warning/10 via-warning/5 to-warning/10 border-y border-warning/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-text-secondary text-center leading-relaxed">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>

      <div className="bg-surface/50 backdrop-blur-sm pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/30">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-bold text-text-primary">
                  Health<span className="text-primary">AI</span>
                </h1>
              </Link>
              <p className="text-sm text-text-secondary leading-relaxed">
                AI-powered healthcare platform for smarter diagnosis, seamless appointments, and better care.
              </p>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Heart className="w-4 h-4 text-danger" />
                <span>Made with care for patients worldwide</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">
                {t('footer.services')}
              </h3>
              <ul className="space-y-3">
                {[
                  { label: 'Smart Appointment Booking', path: '/appointments' },
                  { label: 'AI Report Scanner', path: '/reports' },
                  { label: 'Hospital Finder', path: '/hospitals' },
                  { label: 'Doctor Directory', path: '/doctors' },
                  { label: 'AI Symptom Checker', path: '/symptom-checker' },
                ].map(item => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-sm text-text-secondary hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">
                {t('footer.about')}
              </h3>
              <ul className="space-y-3">
                {[
                  { label: 'About Us', path: '#' },
                  { label: 'Privacy Policy', path: '#' },
                  { label: 'Terms of Service', path: '#' },
                  { label: 'Contact Support', path: '#' },
                  { label: 'FAQs', path: '#' },
                ].map(item => (
                  <li key={item.label}>
                    <Link
                      to={item.path}
                      className="text-sm text-text-secondary hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4">
                {t('footer.contact')}
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-text-secondary">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Hyderabad, Telangana, India</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-secondary">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>+91 40 1234 5678</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-secondary">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>support@mediqueue.com</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-slate-200/60">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-text-secondary">
                &copy; {new Date().getFullYear()} MediQueue. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <Link to="#" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  {t('footer.privacy')}
                </Link>
                <Link to="#" className="text-sm text-text-secondary hover:text-primary transition-colors">
                  {t('footer.terms')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
