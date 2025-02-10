'use client';

import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './ErrorBoundary';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  messages: any;
};

export default function ErrorBoundaryWrapper({ children, messages }: Props) {
  return (
    <ErrorBoundary FallbackComponent={(props) => <ErrorFallback {...props} messages={messages} />}>
      {children}
    </ErrorBoundary>
  );
}