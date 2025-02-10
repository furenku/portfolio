'use client';

import { useTranslations } from 'next-intl';
import { ReloadIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { FallbackProps } from 'react-error-boundary';

export default function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const t = useTranslations('ui');
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-850 px-4 py-16 text-center" role="alert">
      <div className="rounded-lg bg-slate-800/50 p-8 shadow-lg backdrop-blur">
        <ExclamationTriangleIcon className="mx-auto mb-4 size-12 text-red-500" aria-hidden="true" />
        <h2 className="mb-4 text-2xl font-bold text-white">{t('ui.error.title')}</h2>
        <p className="mb-6 text-gray-300">{error.message || t('ui.error.description')}</p>
        <button
          onClick={resetErrorBoundary}
          className="rounded bg-cyan-500 px-4 py-2 font-semibold text-white transition hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          aria-label={t('ui.error.reload')}
        >
          <ReloadIcon className="mr-2 inline size-4" aria-hidden="true" />
          {t('ui.error.reload')}
        </button>
      </div>
    </div>
  );
} 