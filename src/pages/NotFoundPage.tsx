import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, FileQuestion } from 'lucide-react';
import { GradientButton } from '../components/ui/GradientButton';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative"
      >
        <div className="bg-surface rounded-2xl shadow-neumorph p-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
            <FileQuestion className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">404</h1>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Page Not Found</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="flex-1">
              <button className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-surface shadow-neumorph text-text-secondary hover:text-text-primary text-sm font-medium transition-all">
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
