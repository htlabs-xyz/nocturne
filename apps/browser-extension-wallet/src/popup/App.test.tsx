import { describe, it, expect, vi } from 'vitest';

vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({ render: vi.fn() })),
}));

describe('App', () => {
  it('should export App component', async () => {
    const { App } = await import('./App');
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });
});
