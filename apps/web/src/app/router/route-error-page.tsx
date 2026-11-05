import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ErrorState } from '@/components/shared/error-state';
import { NotFoundPage } from './not-found-page';

/** Rendered when a route throws while rendering. */
export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }
  return (
    <ErrorState
      title="This page crashed"
      error={error}
      onRetry={() => window.location.reload()}
      retryLabel="Reload page"
    />
  );
}
