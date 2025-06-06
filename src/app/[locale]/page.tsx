import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import PageLayout from '@/components/layout/PageLayout';
import BackgroundAnimation from '@/components/layout/BackgroundAnimation/BackgroundAnimation';
type Props = {
  params: {locale: string};
};

export default function IndexPage({params: {locale}}: Props) {
  // Enable static rendering
  setRequestLocale(locale);

  const t = useTranslations('home');

  return (
    <PageLayout>
      <BackgroundAnimation />
      <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
        {t('greeting')}
      </h1>
      <p className="max-w-[590px]">
        { t('description') }
      </p>
    </PageLayout>
  );
}
