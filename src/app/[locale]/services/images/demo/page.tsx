import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import StandardLayout from '@/components/layout/StandardLayout';
import { Button } from '@/components/ui/button';
import { Images } from '@/components/services/images/Images';
type Props = {
  params: {locale: string};
};

export default function IndexPage({params: {locale}}: Props) {
  // Enable static rendering
  setRequestLocale(locale);

  const t = useTranslations('sections.services.images');

  return (
    <StandardLayout>
      {/* <BackgroundAnimation /> */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-stretch">
        <div className="flex py-12 flex-1 md:h-[60vh] md:flex-shrink flex-col gap-4 justify-center">
          <Images/>
        </div>



      </div>

    </StandardLayout>
  );
}
