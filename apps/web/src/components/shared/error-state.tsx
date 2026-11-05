import { RotateCw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/** Explains what went wrong in operator terms; never shows stack traces. */
export function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'The AuditFlow API could not be reached. Check that it is running and try again.';
    }
    if (error.status >= 500) {
      return 'The API ran into a problem while handling this request.';
    }
    return error.message;
  }
  return 'Something unexpected happened while rendering this view.';
}

export function ErrorState({
  error,
  title = 'Something went wrong',
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  const requestId = error instanceof ApiError ? error.requestId : null;
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center',
        className,
      )}
    >
      <TriangleAlert className="size-5 text-destructive" aria-hidden="true" />
      <div className="max-w-md space-y-1">
        <h2 className="font-medium text-sm">{title}</h2>
        <p className="text-muted-foreground text-sm">{describeError(error)}</p>
        {requestId ? (
          <p className="text-muted-foreground text-xs">
            Request ID <code className="font-mono">{requestId}</code>
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
