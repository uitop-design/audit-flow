import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Inbox } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/client';
import { EmptyState } from './empty-state';
import { ErrorState } from './error-state';

describe('EmptyState', () => {
  it('renders the title, description and action', () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No events yet"
        description="Send your first event."
        action={<button type="button">Clear filters</button>}
      />,
    );

    expect(screen.getByRole('heading', { name: 'No events yet' })).toBeInTheDocument();
    expect(screen.getByText('Send your first event.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('explains an unreachable API and retries on request', async () => {
    const onRetry = vi.fn();
    render(<ErrorState error={new ApiError('offline', 0)} onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('could not be reached');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows the request id of a failed API call for support', () => {
    const body = {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal server error',
      path: '/api/v1/audit-events',
      requestId: 'req-7f3a',
      timestamp: '2026-11-05T12:00:00.000Z',
    };
    render(<ErrorState error={new ApiError(body.message, 500, body)} />);

    expect(screen.getByRole('alert')).toHaveTextContent('The API ran into a problem');
    expect(screen.getByText('req-7f3a')).toBeInTheDocument();
  });

  it('shows the API message for client errors and nothing technical for crashes', () => {
    const { rerender } = render(
      <ErrorState error={new ApiError('Audit event x not found', 404)} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Audit event x not found');

    rerender(
      <ErrorState error={new TypeError("Cannot read properties of undefined (reading 'id')")} />,
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent('Cannot read properties');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
