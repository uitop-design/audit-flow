import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowRight, Clock, Inbox, Layers, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { auditEventStatsQuery } from '@/features/audit-events/api/audit-events.queries';
import type { AuditEventStats } from '@/lib/api/types';
import { formatCompactTimestamp, formatNumber, humanizeIdentifier } from '@/lib/format';
import { ActivityChart } from '../components/activity-chart';
import { EventTypeBreakdown } from '../components/event-type-breakdown';
import { RecentActivity } from '../components/recent-activity';
import { StatCard } from '../components/stat-card';

export function DashboardPage() {
  const query = useQuery(auditEventStatsQuery);
  const stats = query.data;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          stats
            ? `Activity across your organization · updated ${formatCompactTimestamp(stats.generatedAt)}`
            : 'Activity across your organization.'
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/events">
              View all events
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />
      {query.isPending ? (
        <DashboardSkeleton />
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          title="Could not load dashboard"
          onRetry={() => query.refetch()}
        />
      ) : query.data.totalEvents === 0 ? (
        <EmptyDashboard />
      ) : (
        <DashboardContent stats={query.data} />
      )}
    </>
  );
}

function DashboardContent({ stats }: { stats: AuditEventStats }) {
  const top = stats.topEventType;
  return (
    <div className="space-y-4">
      <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total events"
          icon={Layers}
          value={formatNumber(stats.totalEvents)}
          hint="All time"
        />
        <StatCard
          label="Last 24 hours"
          icon={Clock}
          value={formatNumber(stats.eventsLast24h)}
          hint={`${Math.round((stats.eventsLast24h / stats.totalEvents) * 100)}% of all events`}
        />
        <StatCard
          label="Unique actors"
          icon={Users}
          value={formatNumber(stats.uniqueActors)}
          hint="Distinct actor IDs"
        />
        <StatCard
          label="Most common type"
          icon={Activity}
          value={top ? humanizeIdentifier(top.eventType) : '—'}
          hint={top ? `${formatNumber(top.count)} events` : undefined}
        />
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          title="Activity"
          description="Events per day, last 14 days"
          className="lg:col-span-2"
        >
          <ActivityChart days={stats.dailyVolume} />
        </Panel>
        <Panel title="Events by type" description="Select a type to see its events">
          <EventTypeBreakdown types={stats.byEventType} total={stats.totalEvents} />
        </Panel>
      </div>
      <Panel title="Recent activity" description="The latest recorded events">
        <RecentActivity events={stats.recentEvents} />
      </Panel>
    </div>
  );
}

function Panel({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <p className="text-muted-foreground text-xs">{description}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {['total', 'day', 'actors', 'type'].map((key) => (
          <Skeleton key={key} className="h-[106px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[320px] rounded-xl lg:col-span-2" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <EmptyState
      icon={Inbox}
      title="No audit events recorded yet"
      description={
        <div className="space-y-2">
          <p>The dashboard fills in as soon as an application records its first event.</p>
          <p>
            For demo data, run{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">pnpm db:seed</code>, or
            send an event to{' '}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              POST /api/v1/audit-events
            </code>
            .
          </p>
        </div>
      }
    />
  );
}
