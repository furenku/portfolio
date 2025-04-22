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
    <StandardLayout>
      {/* <BackgroundAnimation /> */}
      <div className="w-full flex flex-col gap-2">
        <h1 className="text-gray-500 text-xl">
          { t('gallery.title') }
        </h1>
        <div className="w-full h-[50vh] sm:h-[60vh] xl:h-[60vh] overflow-y-hidden mb-20">
          <Gallery
            images={new Array(6).fill(true).map((_, i) => ({
              src: `/images/components/gallery/${6-i}.png`,
              alt: 'image ' + (6-i).toString()
            }))}
          />
        </div>
      </div>      

    </StandardLayout>
  );
}
