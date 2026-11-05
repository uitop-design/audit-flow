import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppShell } from '@/components/layout/app-shell';
import { AuditEventsPage } from '@/features/audit-events/pages/audit-events-page';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
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
          {
            index: true,
            element: <DashboardPage />,
            handle: { title: 'Dashboard' } satisfies RouteHandle,
          },
          {
            path: 'events',
            element: <AuditEventsPage />,
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
