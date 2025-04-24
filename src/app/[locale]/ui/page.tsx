import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import HomeLayout from '@/components/layout/HomeLayout';
type Props = {
  params: {locale: string};
};

export default function IndexPage({params: {locale}}: Props) {
  // Enable static rendering
  setRequestLocale(locale);

  const t = useTranslations('sections.ui');

  return (
    <HomeLayout images={[]}>
      {/* <BackgroundAnimation /> */}
      <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
        {t('title')}
      </h1>
      <p className="max-w-[590px]">
        { t('description') }
      </p>
    </HomeLayout>
  );
}
