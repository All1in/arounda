'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import {
  loginAccount,
  STORAGE_UNAVAILABLE_MESSAGE,
  validateEmail,
  type StoreErrorField,
} from '@/features/account/store';
import { useAccount } from '@/features/account/useAccount';
import styles from './AccountForm.module.scss';

type FieldErrors = Partial<Record<StoreErrorField, string>>;

function checkEmail(value: string): string | null {
  return value.trim() === '' ? null : validateEmail(value);
}

export default function LoginForm() {
  const router = useRouter();
  const { storageAvailable, ready } = useAccount();
  const emailRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  function setEmailError(message: string | null) {
    setErrors((previous) => {
      if (previous.email === (message ?? undefined)) return previous;
      const next = { ...previous };
      if (message) next.email = message;
      else delete next.email;
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = loginAccount({ email: emailRef.current?.value ?? '' });

    if (result.ok) {
      setPending(true);
      router.push('/profile');
      return;
    }

    setErrors((previous) => ({ ...previous, [result.field]: result.message }));

    if (result.field === 'email') emailRef.current?.focus();
    else alertRef.current?.focus();
  }

  const unavailable = ready && !storageAvailable;
  const formError = unavailable ? STORAGE_UNAVAILABLE_MESSAGE : errors.form;

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError ? (
          <p className={styles.formError} role="alert" tabIndex={-1} ref={alertRef}>
            {formError}
          </p>
        ) : null}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            ref={emailRef}
            className={styles.input}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            onBlur={(event) => setEmailError(checkEmail(event.target.value))}
            onChange={(event) => {
              if (errors.email && checkEmail(event.target.value) === null) setEmailError(null);
            }}
          />
          {errors.email ? (
            <p className={styles.error} id="login-email-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <button type="submit" className={styles.submit} disabled={unavailable || pending}>
          {pending ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className={styles.switch}>
        New here? <Link href="/register">Create an account</Link>
      </p>
    </>
  );
}
