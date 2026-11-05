import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderRoute } from '@/test/render';
import { RouteErrorPage } from './route-error-page';

function Crashes(): never {
  throw new Error('render failed: secret internal detail');
}

describe('RouteErrorPage', () => {
  it('shows a friendly error instead of a blank page when a route crashes', async () => {
    // React logs caught render errors; keep test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderRoute('/', [{ path: '/', element: <Crashes />, errorElement: <RouteErrorPage /> }]);

    expect(await screen.findByRole('alert')).toHaveTextContent('This page crashed');
    expect(screen.getByRole('alert')).not.toHaveTextContent('secret internal detail');
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeInTheDocument();
  });
});
