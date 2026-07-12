'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

const registerSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/, 'Include upper, lower, number & symbol'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.message ?? 'Registration failed.');
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New accounts start with Dispatcher access. An Admin can grant additional roles.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">First name</label>
              <input
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Last name</label>
              <input
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
