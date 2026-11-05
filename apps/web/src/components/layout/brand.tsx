import { ShieldCheck } from 'lucide-react';

export function Brand() {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ShieldCheck className="size-4" aria-hidden="true" />
      </div>
      <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
        <span className="font-semibold text-sm">AuditFlow</span>
        <span className="text-muted-foreground text-xs">Audit log</span>
      </div>
    </div>
  );
}
