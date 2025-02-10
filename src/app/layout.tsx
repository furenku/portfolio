import {ReactNode} from 'react';
import {Inter} from 'next/font/google';
import './globals.css';
import ErrorBoundaryWrapper from '@/components/ui/ErrorBoundaryWrapper';
import {clsx} from 'clsx';

const inter = Inter({subsets: ['latin']});

type Props = {
  children: ReactNode;
};

export default function RootLayout({children}: Props) {
  return (
    <html className="h-full">
      <body className={clsx(inter.className, 'h-full')}>
        <ErrorBoundaryWrapper>
          {children}
        </ErrorBoundaryWrapper>
      </body>
    </html>
  );
}