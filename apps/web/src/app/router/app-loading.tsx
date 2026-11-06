import { ShieldCheck } from 'lucide-react';

/** Shown while the first route module loads (route pages are lazy-loaded). */
export function AppLoading() {
  return (
    <div
      role="status"
      className="flex min-h-svh items-center justify-center gap-2 text-muted-foreground text-sm"
    >
      <ShieldCheck className="size-4 animate-pulse" aria-hidden="true" />
      Loading AuditFlow…
    </div>
  );
}
