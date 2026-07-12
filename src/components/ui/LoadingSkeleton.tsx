import { cn } from '../../utils/cn';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3 animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-surface rounded-lg"
          style={{
            width: `${100 - (i % 3) * 20}%`,
            opacity: 0.4 + (i % 3) * 0.2,
          }}
        />
      ))}
    </div>
  );
}
