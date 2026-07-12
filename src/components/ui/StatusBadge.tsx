import { cn } from '../../utils/cn';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  normal: { bg: 'bg-success/10', text: 'text-success', label: 'Normal' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', label: 'Warning' },
  critical: { bg: 'bg-danger/10', text: 'text-danger', label: 'Critical' },
  pending: { bg: 'bg-warning/10', text: 'text-warning', label: 'Pending' },
  confirmed: { bg: 'bg-success/10', text: 'text-success', label: 'Confirmed' },
  completed: { bg: 'bg-primary/10', text: 'text-primary', label: 'Completed' },
  cancelled: { bg: 'bg-danger/10', text: 'text-danger', label: 'Cancelled' },
  rescheduled: { bg: 'bg-secondary/20', text: 'text-text-primary', label: 'Rescheduled' },
  arrived: { bg: 'bg-secondary/20', text: 'text-text-primary', label: 'Arrived' },
  in_queue: { bg: 'bg-primary/10', text: 'text-primary', label: 'In Queue' },
  in_progress: { bg: 'bg-primary/15', text: 'text-primary', label: 'In Progress' },
  no_show: { bg: 'bg-danger/10', text: 'text-danger', label: 'No Show' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { bg: 'bg-text-secondary/10', text: 'text-text-secondary', label: status };
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-sm font-medium', config.bg, config.text, className)}>
      {config.label}
    </span>
  );
}
