'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  registerAccount,
  STORAGE_UNAVAILABLE_MESSAGE,
  validateEmail,
  validateName,
  type StoreErrorField,
} from '@/features/account/store';
import { useAccount } from '@/features/account/useAccount';
import styles from './AccountForm.module.scss';

type FieldName = 'name' | 'email';
type FieldErrors = Partial<Record<StoreErrorField, string>>;

function check(field: FieldName, value: string): string | null {
  if (value.trim() === '') return null;
  return field === 'name' ? validateName(value) : validateEmail(value);
}

export default function RegisterForm() {
  const router = useRouter();
  const { storageAvailable, ready } = useAccount();
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLParagraphElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  function setFieldError(field: FieldName, message: string | null) {
    setErrors((previous) => {
      if (previous[field] === (message ?? undefined)) return previous;
      const next = { ...previous };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  }

  function handleBlur(field: FieldName, value: string) {
    setFieldError(field, check(field, value));
  }

  function handleInput(field: FieldName, value: string) {
    if (errors[field] && check(field, value) === null) setFieldError(field, null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = registerAccount({
      name: nameRef.current?.value ?? '',
      email: emailRef.current?.value ?? '',
    });

    if (result.ok) {
      setPending(true);
      router.push('/profile');
      return;
    }

    setErrors((previous) => ({ ...previous, [result.field]: result.message }));

    if (result.field === 'name') nameRef.current?.focus();
    else if (result.field === 'email') emailRef.current?.focus();
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
          <label className={styles.label} htmlFor="register-name">
            Name
          </label>
          <input
            id="register-name"
            ref={nameRef}
            className={styles.input}
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            required
            maxLength={NAME_MAX_LENGTH}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'register-name-error' : 'register-name-hint'}
            onBlur={(event) => handleBlur('name', event.target.value)}
            onChange={(event) => handleInput('name', event.target.value)}
          />
          {errors.name ? (
            <p className={styles.error} id="register-name-error">
              {errors.name}
            </p>
          ) : (
            <p className={styles.hint} id="register-name-hint">
              {NAME_MIN_LENGTH}–{NAME_MAX_LENGTH} characters.
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="register-email">
            Email
          </label>
          <input
            id="register-email"
            ref={emailRef}
            className={styles.input}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            onBlur={(event) => handleBlur('email', event.target.value)}
            onChange={(event) => handleInput('email', event.target.value)}
          />
          {errors.email ? (
            <p className={styles.error} id="register-email-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <button type="submit" className={styles.submit} disabled={unavailable || pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </>
  );
}
