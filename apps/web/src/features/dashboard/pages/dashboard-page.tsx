import { LayoutDashboard } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

// Placeholder until the dashboard widgets are implemented (Phase 6).
export function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Activity across your organization." />
      <EmptyState icon={LayoutDashboard} title="Dashboard widgets are not built yet" />
    </>
  );
}
