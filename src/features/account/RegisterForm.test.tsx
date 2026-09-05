import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import AccountProvider from '@/features/account/AccountProvider';
import RegisterForm from '@/features/account/RegisterForm';
import {
  DUPLICATE_EMAIL_MESSAGE,
  getSnapshot,
  INVALID_EMAIL_MESSAGE,
  INVALID_NAME_MESSAGE,
  registerAccount,
  subscribe,
} from '@/features/account/store';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/register',
}));

function renderForm() {
  render(
    <AccountProvider>
      <RegisterForm />
    </AccountProvider>,
  );

  return {
    name: screen.getByLabelText('Name'),
    email: screen.getByLabelText('Email'),
    submit: screen.getByRole('button', { name: 'Create account' }),
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

describe('RegisterForm', () => {
  it('labels both fields and describes the name requirement', () => {
    const { name } = renderForm();

    expect(name).toHaveAttribute('aria-describedby', 'register-name-hint');
    expect(document.getElementById('register-name-hint')).toHaveTextContent('2–50 characters.');
  });

  it('shows no validation error before the field is used', () => {
    const { name, email } = renderForm();

    expect(name).not.toHaveAttribute('aria-invalid');
    expect(email).not.toHaveAttribute('aria-invalid');
    expect(document.getElementById('register-name-error')).toBeNull();
  });

  it('flags a one-character name on blur with the same message the submit guard uses', () => {
    const { name } = renderForm();

    fireEvent.change(name, { target: { value: 'A' } });
    fireEvent.blur(name);

    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(errorFor(name)).toBe(INVALID_NAME_MESSAGE);
  });

  it('clears the name error once the value is long enough', () => {
    const { name } = renderForm();

    fireEvent.change(name, { target: { value: 'A' } });
    fireEvent.blur(name);
    expect(errorFor(name)).toBe(INVALID_NAME_MESSAGE);

    fireEvent.change(name, { target: { value: 'Ad' } });

    expect(name).not.toHaveAttribute('aria-invalid');
    expect(name).toHaveAttribute('aria-describedby', 'register-name-hint');
    expect(document.getElementById('register-name-error')).toBeNull();
  });

  it('leaves an untouched empty field alone on blur', () => {
    const { name, email } = renderForm();

    fireEvent.blur(name);
    fireEvent.blur(email);

    expect(name).not.toHaveAttribute('aria-invalid');
    expect(email).not.toHaveAttribute('aria-invalid');
  });

  it('flags an invalid email on blur without disturbing the name error', () => {
    const { name, email } = renderForm();

    fireEvent.change(name, { target: { value: 'A' } });
    fireEvent.blur(name);
    fireEvent.change(email, { target: { value: 'nope' } });
    fireEvent.blur(email);

    expect(errorFor(name)).toBe(INVALID_NAME_MESSAGE);
    expect(errorFor(email)).toBe(INVALID_EMAIL_MESSAGE);
  });

  it('reports an invalid name inline, links it to the field and moves focus there', () => {
    const { name, email, submit } = renderForm();

    fireEvent.change(name, { target: { value: 'A' } });
    fireEvent.change(email, { target: { value: 'ada@example.com' } });
    fireEvent.click(submit);

    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(errorFor(name)).toBe(INVALID_NAME_MESSAGE);
    expect(name).toHaveFocus();
    expect(push).not.toHaveBeenCalled();
  });

  it('reports an invalid email inline', () => {
    const { name, email, submit } = renderForm();

    fireEvent.change(name, { target: { value: 'Ada Lovelace' } });
    fireEvent.change(email, { target: { value: 'ada@example' } });
    fireEvent.click(submit);

    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(errorFor(email)).toBe(INVALID_EMAIL_MESSAGE);
    expect(email).toHaveFocus();
  });

  it('rejects an email that is already registered', () => {
    registerAccount({ name: 'Ada', email: 'ada@example.com' });
    const { name, email, submit } = renderForm();

    fireEvent.change(name, { target: { value: 'Ada Again' } });
    fireEvent.change(email, { target: { value: 'ADA@example.com' } });
    fireEvent.click(submit);

    expect(errorFor(email)).toBe(DUPLICATE_EMAIL_MESSAGE);
    expect(push).not.toHaveBeenCalled();
  });

  it('stores the account, signs in and redirects to the profile', () => {
    const { name, email, submit } = renderForm();

    fireEvent.change(name, { target: { value: 'Ada Lovelace' } });
    fireEvent.change(email, { target: { value: 'Ada@Example.com' } });
    fireEvent.click(submit);

    expect(getSnapshot()).toMatchObject({
      account: { name: 'Ada Lovelace', email: 'ada@example.com' },
      signedIn: true,
    });
    expect(push).toHaveBeenCalledWith('/profile');
  });
});
