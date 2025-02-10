'use client';

import { ReloadIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { FallbackProps } from 'react-error-boundary';
import { NextIntlClientProvider } from 'next-intl';

interface ErrorFallbackProps extends FallbackProps {
  messages: any;
}

export default function ErrorFallback({ error, resetErrorBoundary, messages }: ErrorFallbackProps) {
  return (
    <NextIntlClientProvider messages={messages} locale='en'>
      <div className="flex min-h-screen items-center justify-center bg-black/95 px-4 py-16 text-center" role="alert">
        <div className="rounded-xl border border-white/5 bg-black/40 p-8 shadow-2xl backdrop-blur-md">
          <ExclamationTriangleIcon className="mx-auto mb-6 size-12 text-red-400/90" aria-hidden="true" />
          <h2 className="mb-4 text-2xl font-medium tracking-wide text-white/90">Error</h2>
          <p className="mb-8 text-gray-400">{error.message || "Something went wrong"}</p>
          <button
            onClick={resetErrorBoundary}
            className="group rounded-lg bg-white/10 px-6 py-2.5 font-medium text-white/90 transition-all hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Reload page"
          >
            <ReloadIcon className="mr-2 inline size-4 transition-transform group-hover:rotate-180" aria-hidden="true" />
            Reload Page
          </button>
        </div>
      </div>
    </NextIntlClientProvider>
  );
} 