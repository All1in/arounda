import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import AccountProvider from '@/features/account/AccountProvider';
import LoginForm from '@/features/account/LoginForm';
import {
  INVALID_EMAIL_MESSAGE,
  registerAccount,
  subscribe,
  UNKNOWN_EMAIL_MESSAGE,
} from '@/features/account/store';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/login',
}));

function renderForm() {
  render(
    <AccountProvider>
      <LoginForm />
    </AccountProvider>,
  );

  return {
    email: screen.getByLabelText('Email'),
    submit: screen.getByRole('button', { name: 'Log in' }),
  };
}

function errorFor(field: HTMLElement) {
  const id = field.getAttribute('aria-describedby');
  return id ? document.getElementById(id)?.textContent : undefined;
}

beforeAll(() => {
  subscribe(() => {});
});

beforeEach(() => {
  push.mockClear();
  window.localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage', { key: null }));
});

describe('LoginForm', () => {
  it('asks only for the email the login flow uses', () => {
    const { email } = renderForm();

    expect(email).toBeInTheDocument();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(document.querySelector('input[name="name"]')).toBeNull();
  });

  it('shows no validation error before the field is used', () => {
    const { email } = renderForm();

    expect(email).not.toHaveAttribute('aria-invalid');
    fireEvent.blur(email);
    expect(email).not.toHaveAttribute('aria-invalid');
  });

  it('flags a malformed email on blur and clears it once it is valid', () => {
    const { email } = renderForm();

    fireEvent.change(email, { target: { value: 'nope' } });
    fireEvent.blur(email);

    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(errorFor(email)).toBe(INVALID_EMAIL_MESSAGE);

    fireEvent.change(email, { target: { value: 'ada@example.com' } });

    expect(email).not.toHaveAttribute('aria-invalid');
    expect(document.getElementById('login-email-error')).toBeNull();
  });

  it('still reports an unknown email on submit', () => {
    const { email, submit } = renderForm();

    fireEvent.change(email, { target: { value: 'grace@example.com' } });
    fireEvent.click(submit);

    expect(errorFor(email)).toBe(UNKNOWN_EMAIL_MESSAGE);
    expect(email).toHaveFocus();
    expect(push).not.toHaveBeenCalled();
  });

  it('signs in a known email and redirects to the profile', () => {
    registerAccount({ name: 'Ada Lovelace', email: 'ada@example.com' });
    const { email, submit } = renderForm();

    fireEvent.change(email, { target: { value: 'Ada@Example.com' } });
    fireEvent.click(submit);

    expect(push).toHaveBeenCalledWith('/profile');
  });
});
