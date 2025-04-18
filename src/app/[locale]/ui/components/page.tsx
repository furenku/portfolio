import {useTranslations} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import PageLayout from '@/components/layout/PageLayout';
import BackgroundAnimation from '@/components/layout/BackgroundAnimation/BackgroundAnimation';
import Gallery from '@/components/Gallery';
type Props = {
  params: {locale: string};
};

export default function IndexPage({params: {locale}}: Props) {
  // Enable static rendering
  setRequestLocale(locale);

  const t = useTranslations('sections.ui.components');

  return (
    <PageLayout>
      {/* <BackgroundAnimation /> */}
      
      <h1>
        { t('gallery.title') }
      </h1>
      <Gallery
        images={[
            {
                src: "/file.svg",
                alt: "..."            
            }
        ]}

      />
    </PageLayout>
  );
}
