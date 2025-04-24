import { setRequestLocale } from 'next-intl/server';
import StandardLayout from '@/components/layout/StandardLayout';
import Gallery from '@/components/Gallery';
type Props = {
  params: {locale: string};
};
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';


export default async function IndexPage({ params: { locale } }: Props) {
  // Enable static rendering
  setRequestLocale(locale);

  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const res = await fetch(`${baseUrl}/api/images`, { cache: 'no-store' });

  const images = await res.json();

  // Server-side translation function
  const t = await getTranslations({ locale, namespace: 'sections.ui.components' });

  console.log("\n\nimages", images);
  

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
            images={new Array(7).fill(true).map((_, i) => ({
              src: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/480`,
              sizes: {
                xl: `https://picsum.photos/seed/${(Math.random()*99999).toString()}1/920`,
                lg: `https://picsum.photos/seed/${(Math.random()*99999).toString()}1/024`,
                md: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/768`,
                sm: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/568`,
                xs: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/480`
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
