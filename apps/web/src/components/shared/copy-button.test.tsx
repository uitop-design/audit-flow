import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CopyButton } from './copy-button';

describe('CopyButton', () => {
  it('copies the exact value and confirms it', async () => {
    const { user } = renderWithProviders(
      <CopyButton value="019a5a3c-7e2b-7c41-9f0e-3b8d2a6c1f44" label="event ID" />,
    );

    await user.click(screen.getByRole('button', { name: 'Copy event ID' }));

    expect(await navigator.clipboard.readText()).toBe('019a5a3c-7e2b-7c41-9f0e-3b8d2a6c1f44');
    expect(screen.getByRole('button', { name: 'Copied event ID' })).toBeInTheDocument();
  });
});
