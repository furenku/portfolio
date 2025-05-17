import { useTranslations } from 'next-intl';
import HomeLayout from '@/components/layout/HomeLayout';


export default function Page() {

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
