import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-md border bg-muted/50">
        <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="max-w-sm space-y-1">
        <h2 className="font-medium text-sm">{title}</h2>
        {description ? <div className="text-muted-foreground text-sm">{description}</div> : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
