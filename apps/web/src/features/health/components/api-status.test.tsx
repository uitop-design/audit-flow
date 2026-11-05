import { screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { buildHealthReport } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { ApiStatus } from './api-status';

describe('ApiStatus', () => {
  it('reports a healthy API with database latency', async () => {
    renderWithProviders(<ApiStatus />);

    expect(screen.getByRole('status')).toHaveTextContent('Checking API…');
    expect(await screen.findByText('API operational')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Database 3 ms');
  });

  it('reports a database outage from a 503 health report', async () => {
    server.use(
      http.get('*/api/v1/health', () =>
        HttpResponse.json(
          buildHealthReport({ status: 'error', checks: { database: { status: 'down' } } }),
          { status: 503 },
        ),
      ),
    );

    renderWithProviders(<ApiStatus />);

    expect(await screen.findByText('Database unavailable')).toBeInTheDocument();
  });

  it('reports an unreachable API', async () => {
    server.use(http.get('*/api/v1/health', () => HttpResponse.error()));

    renderWithProviders(<ApiStatus />);

    expect(await screen.findByText('API unreachable')).toBeInTheDocument();
  });
});
