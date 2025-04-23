import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import StandardLayout from '@/components/layout/StandardLayout';
import Gallery from '@/components/Gallery';
type Props = {
  params: {locale: string};
};

export default function IndexPage({params: {locale}}: Props) {
  // Enable static rendering
  setRequestLocale(locale);

  const t = useTranslations('sections.ui.components');

  return (
    <StandardLayout view="fullscreen">
      {/* <BackgroundAnimation /> */}
      <div className="w-full flex flex-col gap-2">
        <div className="container mx-auto my-4">
        <h1 className="text-gray-500 text-3xl">
          { t('gallery.title') }
        </h1>
        </div>
        <div className="w-full h-[50vh] sm:h-[60vh] xl:h-[60vh] overflow-y-hidden mb-20">
          <Gallery
            images={new Array(7).fill(true).map((_, i) => ({
              src: `/images/components/gallery/${7-i}.png`,
              sizes: {
                xl: `/images/components/gallery/${7-i}.png`,
                lg: `/images/components/gallery/${7-i}.png`,
                md: `/images/components/gallery/${7-i}.png`,
                sm: `/images/components/gallery/${7-i}.png`,
                xs: `/images/components/gallery/${7-i}.png`
              },
              alt: 'image ' + (6-i).toString(),
              caption: 'Caption text for image ' + (6-i).toString(),
            }))}
          />
        </div>
      </div>      

    </StandardLayout>
  );
}
