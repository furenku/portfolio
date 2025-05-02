import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import StandardLayout from '@/components/layout/StandardLayout';
import { Button } from '@/components/ui/button';
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
          <h1 className="text-3xl font-semibold md:text-5xl">
              {t('title')}
          </h1>
          <p className="max-w-[35rem]">
              { t('description') }
          </p>
          <footer>
              <Button>
                  Demo
              </Button>
          </footer>
        </div>


        <div className="demo flex w-full min-h-[66vh] md:h-auto md:min-w-md md:max-w-lg bg-gray-300 rounded-xl">
            
        </div>


      </div>

    </StandardLayout>
  );
}
