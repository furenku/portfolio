import {useTranslations} from 'next-intl';
import {ReactNode} from 'react';
import ExternalLink from '@/components/ui/ExternalLink';

type Props = {
  children?: ReactNode;
};

export default function PageLayout({children}: Props) {
    
  const t = useTranslations('ui');

  return (
    <div className="relative flex grow flex-col bg-slate-850 py-36">
      <div className="absolute inset-0 overflow-hidden">
        {/* <div className="absolute left-0 top-1 size-[20500px] translate-x-[-47.5%] rounded-full bg-gradient-to-b from-slate-900 via-cyan-500" /> */}
      </div>
      <div className="container relative flex grow flex-col px-4">        
        <div className="mt-6 text-gray-400 md:text-lg">{children}</div>
        <footer className="mt-auto grid grid-cols-1 gap-4 pt-20 md:grid-cols-2 lg:gap-12">
          <ExternalLink
            description={t('links.github.description')}
            href={t('links.github.href')}
            title={t('links.github.title')}
          />
          <ExternalLink
            description={t('links.repo.description')}
            href={t('links.repo.href')}
            title={t('links.repo.title')}
          />
        </footer>
      </div>
    </div>
  );
}