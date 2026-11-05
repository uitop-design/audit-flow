import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatLongDate, formatShortDate } from '@/lib/format';
import { startOfDay, toDayString } from '../lib/filters';

interface DateRangeFilterProps {
  from: string | undefined;
  to: string | undefined;
  onChange: (range: { from: string | undefined; to: string | undefined }) => void;
}

const PRESETS = [
  { label: 'Today', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
] as const;

export function describeDateRange(from: string | undefined, to: string | undefined): string | null {
  if (!from && !to) {
    return null;
  }
  if (from && to) {
    return from === to
      ? formatLongDate(startOfDay(from))
      : `${formatShortDate(startOfDay(from))} – ${formatLongDate(startOfDay(to))}`;
  }
  return from
    ? `From ${formatLongDate(startOfDay(from))}`
    : `Until ${formatLongDate(startOfDay(to as string))}`;
}

/** Inclusive day range in the viewer's time zone; converted to instants only when querying. */
export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const selected: DateRange | undefined = from
    ? { from: startOfDay(from), to: to ? startOfDay(to) : undefined }
    : undefined;

  function applyPreset(days: number) {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
    onChange({ from: toDayString(start), to: toDayString(today) });
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start font-normal sm:w-auto">
          <CalendarDays aria-hidden="true" />
          {describeDateRange(from, to) ?? 'Any time'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col sm:flex-row">
          <div className="flex gap-1 border-b p-2 sm:flex-col sm:border-r sm:border-b-0">
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => applyPreset(preset.days)}
              >
                {preset.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-muted-foreground"
              disabled={!from && !to}
              onClick={() => {
                onChange({ from: undefined, to: undefined });
                setOpen(false);
              }}
            >
              Any time
            </Button>
          </div>
          <Calendar
            mode="range"
            selected={selected}
            defaultMonth={selected?.from ?? today}
            disabled={{ after: today }}
            onSelect={(range) =>
              onChange({
                from: range?.from ? toDayString(range.from) : undefined,
                to: range?.to ? toDayString(range.to) : undefined,
              })
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
