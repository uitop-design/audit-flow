import { SearchX } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/client';
import { EventDetails } from '../components/details/event-details';
import { useAuditEventDetail } from '../hooks/use-audit-event-detail';

/**
 * `/events/:eventId`: the event in a side panel over the list. Closing returns to the list with
 * the same filters, so the panel never loses the user's place.
 */
export function AuditEventDetailsRoute() {
  const { eventId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const query = useAuditEventDetail(eventId);
  const close = () => navigate({ pathname: '/events', search: location.search });

  return (
    <Sheet open onOpenChange={(open) => !open && close()}>
      <SheetContent
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
        // Focus the panel itself on open. By default Radix focuses the first control (a copy button),
        // which also pops its tooltip before the user has done anything.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
      >
        {query.data ? (
          <EventDetails event={query.data} />
        ) : query.isError ? (
          <DetailsProblem error={query.error} onRetry={() => query.refetch()} onClose={close} />
        ) : (
          <DetailsSkeleton />
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailsSkeleton() {
  return (
    <>
      <SheetHeader className="gap-2 border-b">
        <SheetTitle className="sr-only">Loading event</SheetTitle>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-72" />
      </SheetHeader>
      <div className="space-y-3 p-4" role="status" aria-label="Loading event details">
        {['a', 'b', 'c', 'd', 'e', 'f'].map((key) => (
          <Skeleton key={key} className="h-4 w-full" />
        ))}
      </div>
    </>
  );
}

function DetailsProblem({
  error,
  onRetry,
  onClose,
}: {
  error: unknown;
  onRetry: () => void;
  onClose: () => void;
}) {
  const notFound = error instanceof ApiError && (error.status === 404 || error.status === 400);
  return (
    <>
      <SheetHeader className="border-b">
        <SheetTitle>{notFound ? 'Event not found' : 'Could not load event'}</SheetTitle>
      </SheetHeader>
      <div className="p-4">
        {notFound ? (
          <EmptyState
            icon={SearchX}
            title="This event does not exist"
            description="The link may be mistyped. Recorded events are never deleted, so a valid link always works."
            action={
              <Button variant="outline" size="sm" onClick={onClose}>
                Back to events
              </Button>
            }
          />
        ) : (
          <ErrorState error={error} title="Could not load event" onRetry={onRetry} />
        )}
      </div>
    </>
  );
}
