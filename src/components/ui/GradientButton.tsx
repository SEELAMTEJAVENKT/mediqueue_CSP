import { cn } from '../../utils/cn';
import { type ReactNode } from 'react';

interface GradientButtonProps {
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export function GradientButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  onClick,
  type = 'button',
}: GradientButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 text-base rounded-2xl',
    lg: 'px-8 py-4 text-lg rounded-2xl',
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5',
    secondary: 'bg-surface text-primary shadow-neumorph hover:shadow-neumorph-hover hover:-translate-y-0.5',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
