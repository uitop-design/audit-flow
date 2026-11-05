import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: LucideIcon;
}

export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-sm">{label}</span>
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="truncate font-semibold text-2xl tabular-nums tracking-tight">{value}</div>
        {hint ? <div className="truncate text-muted-foreground text-xs">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}
