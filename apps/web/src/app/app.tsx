import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Phase 1 placeholder confirming Tailwind, shadcn/ui and Lucide are wired up.
// Replaced by the router and app shell in Phase 5.
export function App() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6 text-foreground">
      <div className="flex flex-col items-center gap-4 text-center">
        <ShieldCheck className="size-8 text-muted-foreground" aria-hidden="true" />
        <h1 className="font-semibold text-xl tracking-tight">AuditFlow</h1>
        <p className="max-w-sm text-muted-foreground text-sm">
          Workspace scaffolding is in place. The dashboard is built in later phases.
        </p>
        <Button asChild variant="outline" size="sm">
          <a href="/api/v1">Check API proxy</a>
        </Button>
      </div>
    </main>
  );
}
