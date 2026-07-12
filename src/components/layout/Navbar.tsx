import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Home, Building2, Stethoscope, CalendarDays, FileText,
  LayoutDashboard, User, LogOut, ChevronDown, Globe, Bell
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { Language } from '../../types';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'hi', label: 'Hindi', flag: 'HI' },
  { code: 'te', label: 'Telugu', flag: 'TE' },
];

const navLinks = [
  { path: '/', label: 'nav.home', icon: Home },
  { path: '/hospitals', label: 'nav.hospitals', icon: Building2 },
  { path: '/doctors', label: 'nav.doctors', icon: Stethoscope },
  { path: '/appointments', label: 'nav.appointments', icon: CalendarDays },
  { path: '/reports', label: 'nav.reports', icon: FileText },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications(user?.id);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 glass shadow-glass"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/30">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-text-primary leading-tight">
                Medi<span className="text-primary">Queue</span>
              </h1>
              <p className="text-xs text-text-secondary">Smart Healthcare</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary/10 text-primary shadow-neumorph-inset'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(link.label)}
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-all"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{languages.find(l => l.code === language)?.flag}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-surface rounded-2xl shadow-neumorph-hover p-2 z-50"
                  >
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                          language === lang.code
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-text-secondary hover:bg-surface/50'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            {isAuthenticated && (
              <button className="relative p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-all">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-danger rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  to={user?.role === 'admin' ? '/admin' : user?.role === 'doctor' ? '/doctor' : '/dashboard'}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-all"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('nav.dashboard')}
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface/50 transition-all">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <ChevronDown className="w-3 h-3 text-text-secondary" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-surface rounded-2xl shadow-neumorph-hover p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-surface/50 hover:text-text-primary transition-all">
                      <User className="w-4 h-4" />
                      {t('nav.profile')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-danger hover:bg-danger/5 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-all"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-all"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-t border-white/20 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {t(link.label)}
                  </Link>
                );
              })}
              {isAuthenticated ? (
                <>
                  <Link
                    to={user?.role === 'admin' ? '/admin' : user?.role === 'doctor' ? '/doctor' : '/dashboard'}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-all"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    {t('nav.dashboard')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-danger/5 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <div className="pt-2 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface/50 transition-all"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
