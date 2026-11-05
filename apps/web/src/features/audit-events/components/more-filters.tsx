import { zodResolver } from '@hookform/resolvers/zod';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const field = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`);

// Lengths mirror the API so mistakes are caught before a request; the API still validates everything.
const moreFiltersSchema = z.object({
  actorId: field(255, 'Actor ID'),
  resourceId: field(255, 'Resource ID'),
  source: field(100, 'Source'),
  correlationId: field(128, 'Correlation ID'),
});

export type MoreFiltersValues = z.infer<typeof moreFiltersSchema>;
type MoreFilterKey = keyof MoreFiltersValues;

const FIELDS: { name: MoreFilterKey; label: string; placeholder: string }[] = [
  { name: 'actorId', label: 'Actor ID', placeholder: 'usr_01h8amara' },
  { name: 'resourceId', label: 'Resource ID', placeholder: 'prj_01h9atlas' },
  { name: 'source', label: 'Source', placeholder: 'admin-dashboard' },
  { name: 'correlationId', label: 'Correlation ID', placeholder: 'req_3f9c…' },
];

interface MoreFiltersProps {
  values: Partial<Record<MoreFilterKey, string>>;
  onApply: (values: Record<MoreFilterKey, string | undefined>) => void;
}

/** Exact-match filters that need typing; edited as a draft and applied together. */
export function MoreFilters({ values, onApply }: MoreFiltersProps) {
  const [open, setOpen] = useState(false);
  const activeCount = FIELDS.filter(({ name }) => values[name]).length;
  const form = useForm<MoreFiltersValues>({
    resolver: zodResolver(moreFiltersSchema),
    values: {
      actorId: values.actorId ?? '',
      resourceId: values.resourceId ?? '',
      source: values.source ?? '',
      correlationId: values.correlationId ?? '',
    },
  });

  const submit = form.handleSubmit((data) => {
    onApply({
      actorId: data.actorId || undefined,
      resourceId: data.resourceId || undefined,
      source: data.source || undefined,
      correlationId: data.correlationId || undefined,
    });
    setOpen(false);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <SlidersHorizontal aria-hidden="true" />
          More filters
          {activeCount > 0 ? (
            <span className="rounded bg-primary px-1.5 text-[11px] text-primary-foreground tabular-nums">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <form onSubmit={submit} className="grid gap-3" noValidate>
          {FIELDS.map(({ name, label, placeholder }) => {
            const error = form.formState.errors[name]?.message;
            const id = `more-filters-${name}`;
            return (
              <div key={name} className="grid gap-1.5">
                <Label htmlFor={id}>{label}</Label>
                <Input
                  id={id}
                  placeholder={placeholder}
                  className="font-mono text-xs"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  {...form.register(name)}
                />
                {error ? (
                  <p id={`${id}-error`} className="text-destructive text-xs">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}
          <p className="text-muted-foreground text-xs">
            Exact matches. Leave a field empty to ignore it.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                form.reset({ actorId: '', resourceId: '', source: '', correlationId: '' })
              }
            >
              Reset
            </Button>
            <Button type="submit" size="sm">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
