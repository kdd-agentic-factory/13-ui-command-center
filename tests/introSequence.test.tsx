/**
 * IntroSequence — locks the award-entry contract: it shows the brand beat
 * chain, Skip works from the first second, and it never replays within the
 * same session (respectful by design).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntroSequence } from '../src/components/intro/IntroSequence';

beforeEach(() => sessionStorage.clear());

describe('IntroSequence', () => {
  it('plays the telemetry-lap entry with title, chips and skip', () => {
    render(<IntroSequence />);
    expect(screen.getByTestId('intro-sequence')).toBeInTheDocument();
    expect(screen.getByText('KDD MOTO INTELLIGENCE')).toBeInTheDocument();
    expect(screen.getByText('ORACLE PIT-WALL')).toBeInTheDocument();
    expect(screen.getByText('SKIP INTRO →')).toBeInTheDocument();
  });

  it('skip finishes the sequence and marks it seen', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<IntroSequence onDone={onDone} />);

    fireEvent.click(screen.getByText('SKIP INTRO →'));
    vi.advanceTimersByTime(700); // fade-out window
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem('kdd-intro-seen')).toBe('1');
    vi.useRealTimers();
  });

  it('never replays within the same session', () => {
    sessionStorage.setItem('kdd-intro-seen', '1');
    render(<IntroSequence />);
    expect(screen.queryByTestId('intro-sequence')).toBeNull();
  });
});
