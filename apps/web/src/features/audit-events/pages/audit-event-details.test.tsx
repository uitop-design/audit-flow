import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import type { AuditEvent } from '@/lib/api/types';
import { buildAuditEvent, buildAuditEventList } from '@/test/fixtures';
import { renderRoute } from '@/test/render';
import { server } from '@/test/server';

const ROLE_CHANGE = buildAuditEvent({
  id: '019a0000-0000-7000-8000-000000000001',
  eventType: 'PERMISSION',
  action: 'ROLE_CHANGED',
  description: "Changed Priya Raman's organization role from member to admin",
  resourceType: 'USER',
  resourceId: 'usr_priya',
  actorId: 'usr_amara',
  actorEmail: 'amara@northwind.example',
  actorName: 'Amara Okafor',
  before: { role: 'MEMBER' },
  after: { role: 'ADMIN' },
  metadata: { targetEmail: 'priya@northwind.example' },
  ipAddress: '203.0.113.24',
  userAgent: 'Mozilla/5.0 (Macintosh)',
  correlationId: 'req_cfa838a02b34cd29',
  source: 'admin-dashboard',
});

/** Serves list and detail endpoints for the given events. */
function serveEvents(events: AuditEvent[], detail?: (id: string) => Response | undefined) {
  const detailRequests: string[] = [];
  server.use(
    http.get('*/api/v1/audit-events/:id', ({ params }) => {
      const id = String(params.id);
      if (id === 'stats' || id === 'facets') {
        return undefined; // Fall through to the default handlers.
      }
      detailRequests.push(id);
      const custom = detail?.(id);
      if (custom) {
        return custom;
      }
      const event = events.find((candidate) => candidate.id === id);
      return event
        ? HttpResponse.json(event)
        : HttpResponse.json(
            {
              statusCode: 404,
              error: 'Not Found',
              message: `Audit event ${id} not found`,
              path: `/api/v1/audit-events/${id}`,
              requestId: 'req-404',
              timestamp: '2026-11-05T12:00:00.000Z',
            },
            { status: 404 },
          );
    }),
    http.get('*/api/v1/audit-events', () => HttpResponse.json(buildAuditEventList(events))),
  );
  return { detailRequests };
}

function section(name: string) {
  return screen.getByRole('region', { name });
}

describe('event details', () => {
  it('opens from the table in a side panel, keeping the list and its filters', async () => {
    serveEvents([ROLE_CHANGE]);
    const { user, router } = renderRoute('/events?eventType=PERMISSION');

    await user.click(await screen.findByRole('link', { name: 'Role changed' }));

    const panel = await screen.findByRole('dialog', { name: 'Role changed' });
    expect(panel).toHaveAccessibleDescription(ROLE_CHANGE.description);
    expect(router.state.location.pathname).toBe(`/events/${ROLE_CHANGE.id}`);
    expect(router.state.location.search).toBe('?eventType=PERMISSION');
    expect(document.title).toBe('Event details · AuditFlow');
  });

  it('opens when the row itself is clicked', async () => {
    serveEvents([ROLE_CHANGE]);
    const { user, router } = renderRoute('/events');

    await user.click(await screen.findByText('admin-dashboard'));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/events/${ROLE_CHANGE.id}`));
    expect(await screen.findByRole('dialog', { name: 'Role changed' })).toBeInTheDocument();
  });

  it('shows every recorded field', async () => {
    serveEvents([ROLE_CHANGE]);
    renderRoute(`/events/${ROLE_CHANGE.id}`);
    await screen.findByRole('dialog', { name: 'Role changed' });

    expect(within(section('Event')).getByText(ROLE_CHANGE.id)).toBeInTheDocument();
    expect(within(section('Event')).getByText('ROLE_CHANGED')).toBeInTheDocument();
    expect(within(section('Actor')).getByText('Amara Okafor')).toBeInTheDocument();
    expect(within(section('Actor')).getByText('amara@northwind.example')).toBeInTheDocument();
    expect(within(section('Resource')).getByText('usr_priya')).toBeInTheDocument();
    const context = section('Request context');
    for (const text of [
      'admin-dashboard',
      '203.0.113.24',
      'Mozilla/5.0 (Macintosh)',
      'req_cfa838a02b34cd29',
    ]) {
      expect(within(context).getByText(text)).toBeInTheDocument();
    }
    expect(within(section('Metadata')).getByText('"priya@northwind.example"')).toBeInTheDocument();
  });

  it('summarises before/after changes and shows both snapshots', async () => {
    serveEvents([ROLE_CHANGE]);
    renderRoute(`/events/${ROLE_CHANGE.id}`);
    await screen.findByRole('dialog', { name: 'Role changed' });

    const changes = section('Changes');
    const summary = within(changes).getByRole('list', { name: 'Changed fields' });
    expect(summary).toHaveTextContent('role"MEMBER""ADMIN"');
    expect(within(changes).getByRole('region', { name: 'before state JSON' })).toHaveTextContent(
      '"MEMBER"',
    );
    expect(within(changes).getByRole('region', { name: 'after state JSON' })).toHaveTextContent(
      '"ADMIN"',
    );
  });

  it.each([
    [
      { before: null, after: { name: 'Atlas' } },
      'No previous state: the resource was created by this event.',
    ],
    [
      { before: { name: 'Atlas' }, after: null },
      'Removed: the resource no longer exists after this event.',
    ],
    [{ before: null, after: null }, 'This event did not record a state change.'],
  ])('explains missing snapshots %#', async (snapshots, message) => {
    const event = { ...ROLE_CHANGE, ...snapshots };
    serveEvents([event]);
    renderRoute(`/events/${event.id}`);
    // Wait for the loaded event, not the loading panel (which is also a dialog).
    await screen.findByRole('dialog', { name: 'Role changed' });

    expect(within(section('Changes')).getByText(message)).toBeInTheDocument();
  });

  it('marks fields that were not recorded and explains system actors', async () => {
    const systemEvent = buildAuditEvent({
      id: '019a0000-0000-7000-8000-000000000002',
      action: 'SESSION_CLEANUP_COMPLETED',
      actorId: null,
      actorEmail: null,
      actorName: null,
      ipAddress: null,
      userAgent: null,
      correlationId: null,
      resourceId: null,
      metadata: {},
    });
    serveEvents([systemEvent]);
    renderRoute(`/events/${systemEvent.id}`);
    await screen.findByRole('dialog', { name: 'Session cleanup completed' });

    expect(
      within(section('Actor')).getByText('Performed by a system process, not a person.'),
    ).toBeInTheDocument();
    expect(within(section('Request context')).getAllByText('Not recorded')).toHaveLength(3);
    expect(within(section('Resource')).getByText('Not recorded')).toBeInTheDocument();
    expect(within(section('Metadata')).getByText('No metadata recorded.')).toBeInTheDocument();
  });

  it('copies the event ID', async () => {
    serveEvents([ROLE_CHANGE]);
    const { user } = renderRoute(`/events/${ROLE_CHANGE.id}`);
    await screen.findByRole('dialog', { name: 'Role changed' });

    await user.click(screen.getByRole('button', { name: 'Copy event ID' }));

    expect(await navigator.clipboard.readText()).toBe(ROLE_CHANGE.id);
  });

  it('links to every event of the same operation', async () => {
    serveEvents([ROLE_CHANGE]);
    const { user, router } = renderRoute(`/events/${ROLE_CHANGE.id}`);
    await screen.findByRole('dialog', { name: 'Role changed' });

    await user.click(screen.getByRole('link', { name: 'View all events in this operation' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/events'));
    expect(router.state.location.search).toBe('?correlationId=req_cfa838a02b34cd29&sortOrder=asc');
  });

  it('closes back to the list with the same filters', async () => {
    serveEvents([ROLE_CHANGE]);
    const { user, router } = renderRoute(`/events/${ROLE_CHANGE.id}?eventType=PERMISSION&page=1`);
    await screen.findByRole('dialog', { name: 'Role changed' });

    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe('/events');
    expect(router.state.location.search).toBe('?eventType=PERMISSION&page=1');
  });

  it('closes with Escape', async () => {
    serveEvents([ROLE_CHANGE]);
    const { user, router } = renderRoute(`/events/${ROLE_CHANGE.id}`);
    await screen.findByRole('dialog', { name: 'Role changed' });

    await user.keyboard('{Escape}');

    await waitFor(() => expect(router.state.location.pathname).toBe('/events'));
  });

  it('explains an unknown event and offers a way back', async () => {
    serveEvents([]);
    const { user, router } = renderRoute('/events/019a0000-0000-7000-8000-00000000dead');

    expect(await screen.findByRole('dialog', { name: 'Event not found' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'This event does not exist' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to events' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/events'));
  });

  it('shows an error with retry when the API fails', async () => {
    let fail = true;
    const api = serveEvents([ROLE_CHANGE], () => (fail ? HttpResponse.error() : undefined));
    const { user } = renderRoute(`/events/${ROLE_CHANGE.id}`);

    const dialog = await screen.findByRole('dialog', { name: 'Could not load event' });
    fail = false;
    await user.click(within(dialog).getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('dialog', { name: 'Role changed' })).toBeInTheDocument();
    expect(api.detailRequests).toHaveLength(2);
  });
});

describe('dashboard recent activity', () => {
  it('links each event to its details', async () => {
    serveEvents([ROLE_CHANGE]);
    const { user, router } = renderRoute('/');

    await user.click(await screen.findByRole('link', { name: 'Signed in with SSO' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/events/evt-1'));
  });
});
