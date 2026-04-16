// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next-themes
const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'system', setTheme: mockSetTheme }),
}));

import { TopBar } from './TopBar';

describe('TopBar', () => {
  beforeEach(() => mockSetTheme.mockClear());

  it('renders three theme buttons', () => {
    render(<TopBar />);
    expect(screen.getByRole('button', { name: /light/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /system/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dark/i })).toBeInTheDocument();
  });

  it('calls setTheme("light") when Light is clicked', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /light/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme("dark") when Dark is clicked', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /dark/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme("system") when System is clicked', () => {
    render(<TopBar />);
    fireEvent.click(screen.getByRole('button', { name: /system/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('marks the active theme button', () => {
    render(<TopBar />);
    // 'system' is the mocked active theme
    const systemBtn = screen.getByRole('button', { name: /system/i });
    expect(systemBtn).toHaveAttribute('data-active', 'true');
  });
});
