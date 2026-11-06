import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { JsonViewer } from './json-viewer';

describe('JsonViewer', () => {
  const value = {
    role: 'ADMIN',
    seats: 25,
    active: true,
    manager: null,
    settings: { deployments: { requireApproval: true, approvers: ['team:platform'] } },
    tags: [],
  };

  it('renders keys and typed values', () => {
    renderWithProviders(<JsonViewer value={value} label="after state" />);
    const viewer = screen.getByRole('region', { name: 'after state JSON' });

    for (const text of ['"role"', '"ADMIN"', '25', 'true', 'null', '"tags"', '[]']) {
      expect(within(viewer).getAllByText(text).length).toBeGreaterThan(0);
    }
  });

  it('collapses deeply nested values but keeps the first level open', () => {
    const { container } = renderWithProviders(<JsonViewer value={value} label="after state" />);
    const [settings, deployments] = container.querySelectorAll('details');

    expect(settings).toHaveAttribute('open');
    expect(deployments).not.toHaveAttribute('open');
    expect(within(deployments as HTMLElement).getByText('2 keys')).toBeInTheDocument();
  });

  it('highlights the requested top-level keys only', () => {
    const { container } = renderWithProviders(
      <JsonViewer
        value={value}
        label="after state"
        highlightKeys={new Set(['role', 'settings'])}
      />,
    );

    const highlighted = [...container.querySelectorAll('[data-highlighted]')].map(
      (element) => element.textContent?.split(':')[0],
    );
    expect(highlighted).toEqual(['"role"', '"settings"']);
  });

  it('renders markup in values as plain text', () => {
    const { container } = renderWithProviders(
      <JsonViewer value={{ note: '<img src=x onerror="alert(1)">' }} label="metadata" />,
    );

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('"<img src=x onerror=\\"alert(1)\\">"')).toBeInTheDocument();
  });

  it('copies pretty-printed JSON', async () => {
    const { user } = renderWithProviders(
      <JsonViewer value={{ role: 'ADMIN' }} label="after state" />,
    );

    await user.click(screen.getByRole('button', { name: 'Copy after state JSON' }));

    expect(await navigator.clipboard.readText()).toBe('{\n  "role": "ADMIN"\n}');
  });
});
