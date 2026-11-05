import { cn } from '@/lib/utils';
import { eventTypeColor } from '../lib/event-type';

export function EventTypeBadge({
  eventType,
  className,
}: {
  eventType: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border bg-background px-1.5 py-0.5 font-medium font-mono text-[11px] text-foreground/80',
        className,
      )}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: eventTypeColor(eventType) }}
        aria-hidden="true"
      />
      {eventType}
    </span>
  );
}
