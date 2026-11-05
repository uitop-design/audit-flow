import { useEffect } from 'react';
import { Outlet } from 'react-router';
import { useRouteTitle } from '@/app/router/route-handle';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';

const APP_NAME = 'AuditFlow';

export function AppShell() {
  const title = useRouteTitle() ?? APP_NAME;

  useEffect(() => {
    document.title = title === APP_NAME ? APP_NAME : `${title} · ${APP_NAME}`;
  }, [title]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader title={title} />
        {/* SidebarInset is the page's <main> landmark; this only constrains the content width. */}
        <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
