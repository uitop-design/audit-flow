import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppShell } from '@/components/layout/app-shell';
import { AppLoading } from './app-loading';
import { NotFoundPage } from './not-found-page';
import { RouteErrorPage } from './route-error-page';
import type { RouteHandle } from './route-handle';

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    hydrateFallbackElement: <AppLoading />,
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
            children: [
              {
                // Details open in a side panel over the list, so filters and scroll position survive.
                path: ':eventId',
                lazy: async () => ({
                  Component: (
                    await import('@/features/audit-events/pages/audit-event-details-route')
                  ).AuditEventDetailsRoute,
                }),
                handle: { title: 'Event details' } satisfies RouteHandle,
              },
            ],
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
