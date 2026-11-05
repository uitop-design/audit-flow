import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { healthQuery } from '../api/health';

type Tone = 'pending' | 'ok' | 'warning' | 'critical';

const DOT: Record<Tone, string> = {
  pending: 'bg-muted-foreground/40',
  ok: 'bg-success',
  warning: 'bg-warning',
  critical: 'bg-destructive',
};

/** Live API and database status from the health endpoint, refreshed every 30 seconds. */
export function ApiStatus() {
  const { data, isPending, isError } = useQuery(healthQuery);

  let tone: Tone;
  let label: string;
  let detail: string | null = null;
  if (isPending) {
    tone = 'pending';
    label = 'Checking API…';
  } else if (isError) {
    tone = 'critical';
    label = 'API unreachable';
  } else if (data.status === 'ok') {
    tone = 'ok';
    label = 'API operational';
    detail =
      data.checks.database.latencyMs === undefined
        ? null
        : `Database ${data.checks.database.latencyMs} ms`;
  } else {
    tone = 'warning';
    label = 'Database unavailable';
  }

  return (
    <div
      role="status"
      title={detail ? `${label} · ${detail}` : label}
      className="flex items-center gap-2 px-2 py-1.5 text-xs group-data-[collapsible=icon]:justify-center"
    >
      <span className={cn('size-2 shrink-0 rounded-full', DOT[tone])} aria-hidden="true" />
      <span className="truncate text-sidebar-foreground/80 group-data-[collapsible=icon]:sr-only">
        {label}
        {detail ? <span className="text-muted-foreground tabular-nums"> · {detail}</span> : null}
      </span>
    </div>
  );
}
