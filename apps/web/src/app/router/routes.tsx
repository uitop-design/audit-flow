import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppShell } from '@/components/layout/app-shell';
import { NotFoundPage } from './not-found-page';
import { RouteErrorPage } from './route-error-page';
import type { RouteHandle } from './route-handle';

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      {
        // Pathless boundary: errors render inside the shell, so navigation stays available.
        errorElement: <RouteErrorPage />,
        children: [
          // Feature pages load on demand, so charts and the data table are not in the initial bundle.
          {
            index: true,
            lazy: async () => ({
              Component: (await import('@/features/dashboard/pages/dashboard-page')).DashboardPage,
            }),
            handle: { title: 'Dashboard' } satisfies RouteHandle,
          },
          {
            path: 'events',
            lazy: async () => ({
              Component: (await import('@/features/audit-events/pages/audit-events-page'))
                .AuditEventsPage,
            }),
            handle: { title: 'Audit events' } satisfies RouteHandle,
          },
          {
            path: '*',
            element: <NotFoundPage />,
            handle: { title: 'Page not found' } satisfies RouteHandle,
          },
        ],
      },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
