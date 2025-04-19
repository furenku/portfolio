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
      <div className={clsx(inter.className, 'flex w-screen h-screen flex-col relative')}>
        <Navigation />
        {children}
        <footer className="w-screen fixed bottom-0 h-20 flex items-center justify-between px-4 text-sm text-gray-500">
          <div>
            <a href="mailto:info@rodrigofrenk.com">
              <span className="font-bold pr-2">
                Contacto:
              </span>
              <span>
                ✉️
              </span>
            </a>
          </div>
          <span>© 2025</span>
          
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
