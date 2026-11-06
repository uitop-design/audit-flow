import type { ReactNode } from 'react';

/** Placeholder for a field the event did not record. */
export function NotRecorded() {
  return (
    <span className="text-muted-foreground">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not recorded</span>
    </span>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3" aria-label={title}>
      <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">{title}</h3>
      {children}
    </section>
  );
}

export function DetailList({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-[minmax(96px,auto)_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
      {children}
    </dl>
  );
}

export function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children ?? <NotRecorded />}</dd>
    </>
  );
}

/** Monospace identifier, optionally with a copy button. */
export function Identifier({ value, copy }: { value: string | null; copy?: ReactNode }) {
  if (value === null) {
    return <NotRecorded />;
  }
  return (
    <span className="inline-flex max-w-full items-center gap-1">
      <code className="truncate font-mono text-xs">{value}</code>
      {copy}
    </span>
  );
}
