import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { createMemoryRouter, type RouteObject } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { routes as appRoutes } from '@/app/router/routes';
import { TooltipProvider } from '@/components/ui/tooltip';

/** No retries in tests: failures should surface immediately. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/** Renders the real route tree (or custom routes) at `path`, with all app providers. */
export function renderRoute(path = '/', routes: RouteObject[] = appRoutes) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const queryClient = createTestQueryClient();
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>,
  );
  return { ...result, router, user, queryClient };
}

/** Renders a single component with providers (no router). */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{ui}</TooltipProvider>
    </QueryClientProvider>,
  );
  return { ...result, user, queryClient };
}
