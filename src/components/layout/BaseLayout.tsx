import {clsx} from 'clsx';
import {Inter} from 'next/font/google';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {ReactNode} from 'react';
import Navigation from '@/components/layout/Navigation';

const inter = Inter({subsets: ['latin']});

type Props = {
  children: ReactNode;
};

export default async function BaseLayout({children}: Props) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <div className={clsx(inter.className, 'flex h-full flex-col')}>
        <Navigation />
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
