import {notFound} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {ReactNode} from 'react';
import BaseLayout from '@/components/layout/BaseLayout';
import {routing} from '@/i18n/routing';

type Props = {
  children: ReactNode;
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}


export async function generateMetadata({
  params
}: Omit<Props, 'children'>) {
  const {locale} = await params; // Fix: Await params before destructuring
  const t = await getTranslations({locale, namespace: 'config.ui'});

  return {
    title: t('title'),
    htmlAttributes: {
      lang: locale
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const {locale} = await params; // Fix: Await params before destructuring

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  return <BaseLayout>{children}</BaseLayout>;
}
