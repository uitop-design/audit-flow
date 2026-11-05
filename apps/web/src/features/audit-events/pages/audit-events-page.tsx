import { ScrollText } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

// Placeholder until the events table is implemented (Phase 6).
export function AuditEventsPage() {
  return (
    <>
      <PageHeader title="Audit events" description="Every recorded action, newest first." />
      <EmptyState icon={ScrollText} title="The events table is not built yet" />
    </>
  );
}
