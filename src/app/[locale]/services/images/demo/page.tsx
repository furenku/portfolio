import { useTranslations } from 'next-intl';
import StandardLayout from '@/components/layout/StandardLayout';
import { Images } from '@/components/services/images/Images';

export default function DemoPage() {

  const t = useTranslations('sections.services.images');

  return (
    <StandardLayout>
      {/* <BackgroundAnimation /> */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-stretch">
        <h1>{t('title')}</h1>
        <div className="flex py-12 flex-1 md:h-[60vh] md:flex-shrink flex-col gap-4 justify-center">
          <Images/>
        </div>



      </div>

    </StandardLayout>
  );
}
