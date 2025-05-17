import StandardLayout from '@/components/layout/StandardLayout';
import Gallery from '@/components/Gallery';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';


export default async function Page() {

  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/images`, { cache: 'no-store' });

  const images = await res.json();

  // Server-side translation function
  const t = await getTranslations('sections.ui.components');
  

  return (
    <StandardLayout view="fullscreen">
      {/* <BackgroundAnimation /> */}
      <div className="w-full flex flex-col gap-2">
        <div className="container mx-auto my-4">
        <h1 className="text-gray-500 text-3xl">
          { t('items.gallery.title') }
        </h1>
        </div>
        <div className="w-full h-[50vh] sm:h-[60vh] xl:h-[60vh] overflow-y-hidden mb-20">
          <Gallery
            images={images}
          />
        </div>
      </div>      

    </StandardLayout>
  );
}
