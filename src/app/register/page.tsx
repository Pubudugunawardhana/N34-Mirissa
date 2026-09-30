'use client';

import { useActionState, useEffect } from 'react';
import { registerUser } from '@/app/actions/register';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerUser, { message: '', errors: {} });

  useEffect(() => {
    if (state?.success) {
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  }, [state?.success, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-ocean-900 tracking-tight">
            Create an Account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Join N34 Mirissa for exclusive experiences
          </p>
        </div>
        
        {state?.success ? (
          <div className="bg-green-50 text-green-800 p-4 rounded-lg text-center font-medium border border-green-200">
            {state.message} <br/> Redirecting to login...
          </div>
        ) : (
          <form className="mt-8 space-y-6" action={formAction}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="name" className="sr-only">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-ocean-500 focus:border-ocean-500 sm:text-sm"
                  placeholder="Full Name"
                />
                {state?.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>}
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">Email address</label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-ocean-500 focus:border-ocean-500 sm:text-sm"
                  placeholder="Email address"
                />
                {state?.errors?.email && <p className="text-red-500 text-xs mt-1">{state.errors.email[0]}</p>}
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-ocean-500 focus:border-ocean-500 sm:text-sm"
                  placeholder="Password (min 6 characters)"
                />
                {state?.errors?.password && <p className="text-red-500 text-xs mt-1">{state.errors.password[0]}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-ocean-600 hover:bg-ocean-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ocean-500 transition-colors disabled:bg-ocean-400"
              >
                {isPending ? 'Registering...' : 'Sign up'}
              </button>
            </div>
            
            <div className="text-center text-sm text-slate-600 mt-4">
              Already have an account? <Link href="/login" className="text-ocean-600 hover:underline">Sign in</Link>
            </div>
            
            <div className="flex items-end justify-center" aria-live="polite">
              {state?.message && !state?.success && (
                <p className="text-sm text-red-500 text-center">{state.message}</p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
