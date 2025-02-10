'use client';

import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './ErrorBoundary';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

export default function ErrorBoundaryWrapper({ children }: Props) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
} 