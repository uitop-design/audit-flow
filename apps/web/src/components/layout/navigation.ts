import { LayoutDashboard, type LucideIcon, ScrollText } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Match only the exact path (needed for the index route). */
  end?: boolean;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/events', label: 'Audit events', icon: ScrollText },
];
