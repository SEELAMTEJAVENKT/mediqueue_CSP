import { cn } from '../../utils/cn';
import { type ReactNode } from 'react';

interface NeumorphCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  inset?: boolean;
  onClick?: () => void;
}

export function NeumorphCard({ children, className, hover = true, glass = false, inset = false, onClick }: NeumorphCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        inset
          ? 'bg-surface shadow-neumorph-inset'
          : glass
          ? 'glass'
          : 'bg-surface shadow-neumorph',
        hover && !inset && 'hover:shadow-neumorph-hover hover:-translate-y-1 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
