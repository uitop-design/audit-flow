import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderRoute } from '@/test/render';

describe('AppShell', () => {
  it('renders the dashboard with navigation and a page title', async () => {
    renderRoute('/');

    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(document.title).toBe('Dashboard · AuditFlow');
    const nav = screen.getByRole('link', { name: 'Dashboard' });
    expect(nav).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Audit events' })).not.toHaveAttribute('aria-current');
  });

  it('navigates between pages from the sidebar', async () => {
    const { user, router } = renderRoute('/');

    await user.click(screen.getByRole('link', { name: 'Audit events' }));

    expect(router.state.location.pathname).toBe('/events');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Audit events' }),
    ).toBeInTheDocument();
    expect(document.title).toBe('Audit events · AuditFlow');
    expect(screen.getByRole('link', { name: 'Audit events' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('links to the API reference in a new tab', () => {
    renderRoute('/');

    const link = screen.getByRole('link', { name: /API reference/ });
    expect(link).toHaveAttribute('href', 'http://localhost:3000/api/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows a not-found page inside the shell for unknown routes', async () => {
    const { user, router } = renderRoute('/does/not/exist');

    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();

    await user.click(within(main).getByRole('link', { name: 'Back to dashboard' }));
    expect(router.state.location.pathname).toBe('/');
  });

  it('toggles the sidebar from the header', async () => {
    const { user, container } = renderRoute('/');
    const sidebar = container.querySelector('[data-slot="sidebar"][data-state]');
    expect(sidebar).toHaveAttribute('data-state', 'expanded');

    // The header trigger; the sidebar rail is a second, mouse-only toggle with the same label.
    const trigger = container.querySelector<HTMLButtonElement>('[data-sidebar="trigger"]');
    expect(trigger).toHaveAccessibleName('Toggle Sidebar');
    await user.click(trigger as HTMLButtonElement);

    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  });
});
