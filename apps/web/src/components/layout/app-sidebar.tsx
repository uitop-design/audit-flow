import { BookOpen, ExternalLink } from 'lucide-react';
import { NavLink, useMatch } from 'react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { ApiStatus } from '@/features/health/components/api-status';
import { apiUrl } from '@/lib/api/client';
import { Brand } from './brand';
import { type NavItem, PRIMARY_NAV } from './navigation';

function SidebarNavItem({ item }: { item: NavItem }) {
  const match = useMatch({ path: item.to, end: item.end ?? false });
  const { isMobile, setOpenMobile } = useSidebar();
  const Icon = item.icon;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={match !== null} tooltip={item.label}>
        <NavLink
          to={item.to}
          end={item.end}
          // On mobile the sidebar is a drawer; close it once the user has chosen a page.
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <Icon aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Brand />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitor</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PRIMARY_NAV.map((item) => (
                <SidebarNavItem key={item.to} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Developers</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="API reference">
                  <a
                    href={apiUrl('/api/docs').toString()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen aria-hidden="true" />
                    <span>API reference</span>
                    <ExternalLink
                      className="ml-auto size-3 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ApiStatus />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
