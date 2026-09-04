import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RateLimitNotice from './RateLimitNotice';

describe('RateLimitNotice', () => {
  it('announces itself as a status rather than an error', () => {
    render(<RateLimitNotice />);

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent('The photo service rate limit was reached.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('stays vague when the reset time is unknown', () => {
    render(<RateLimitNotice />);

    expect(screen.getByText('Please try again in a few minutes.')).toBeInTheDocument();
  });

  it('converts the wait to whole minutes', () => {
    render(<RateLimitNotice retryAfterSeconds={120} />);

    expect(screen.getByText('Please try again in about 2 minutes.')).toBeInTheDocument();
  });

  it('rounds a part-minute wait up rather than down to zero', () => {
    render(<RateLimitNotice retryAfterSeconds={30} />);

    expect(screen.getByText('Please try again in about 1 minute.')).toBeInTheDocument();
  });

  it('rounds up so a wait is never understated', () => {
    render(<RateLimitNotice retryAfterSeconds={121} />);

    expect(screen.getByText('Please try again in about 3 minutes.')).toBeInTheDocument();
  });

  it.each([0, -60])('falls back to the vague copy for a nonsensical wait of %p', (seconds) => {
    render(<RateLimitNotice retryAfterSeconds={seconds} />);

    expect(screen.getByText('Please try again in a few minutes.')).toBeInTheDocument();
  });
});
