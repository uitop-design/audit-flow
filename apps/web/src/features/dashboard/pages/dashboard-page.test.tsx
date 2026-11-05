import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { buildStats } from '@/test/fixtures';
import { renderRoute } from '@/test/render';
import { server } from '@/test/server';

function serveStats(stats = buildStats()) {
  server.use(http.get('*/api/v1/audit-events/stats', () => HttpResponse.json(stats)));
}

describe('DashboardPage', () => {
  it('shows key figures from the stats endpoint', async () => {
    serveStats();
    renderRoute('/');

    const figures = await screen.findByRole('region', { name: 'Key figures' });
    expect(within(figures).getByText('180')).toBeInTheDocument();
    expect(within(figures).getByText('27')).toBeInTheDocument();
    expect(within(figures).getByText('15% of all events')).toBeInTheDocument();
    expect(within(figures).getByText('10')).toBeInTheDocument();
    expect(within(figures).getByText('Auth')).toBeInTheDocument();
  });

  it('links each event type to the filtered events table', async () => {
    serveStats();
    const { user, router } = renderRoute('/');

    await user.click(await screen.findByRole('link', { name: /^API key: 32 events, 18%/ }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/events'));
    expect(router.state.location.search).toBe('?eventType=API_KEY');
  });

  it('describes the activity chart in text', async () => {
    serveStats();
    renderRoute('/');

    expect(
      await screen.findByText(/100 events in the last 14 days; busiest day Nov 14 with 22\./),
    ).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Events per day' })).toBeInTheDocument();
  });

  it('lists recent activity, including system actors', async () => {
    serveStats();
    renderRoute('/');

    expect(await screen.findByText('Signed in with SSO')).toBeInTheDocument();
    expect(screen.getByText('Removed expired sessions')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('shows a helpful empty state instead of zeros when there are no events', async () => {
    serveStats(
      buildStats({
        totalEvents: 0,
        eventsLast24h: 0,
        uniqueActors: 0,
        topEventType: null,
        byEventType: [],
        recentEvents: [],
      }),
    );
    renderRoute('/');

    expect(
      await screen.findByRole('heading', { name: 'No audit events recorded yet' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Key figures' })).not.toBeInTheDocument();
  });

  it('shows an error state with retry', async () => {
    server.use(http.get('*/api/v1/audit-events/stats', () => HttpResponse.error()));
    renderRoute('/');

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load dashboard');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
