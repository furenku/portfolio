import {useTranslations} from 'next-intl';
import {ReactNode} from 'react';
import ExternalLink from '@/components/ui/ExternalLink';

type Props = {
  children?: ReactNode;
};

export default function HomeLayout({children}: Props) {
    
  const t = useTranslations('config.ui');

  return (
    <div className="relative flex grow flex-col bg-slate-850 py-36">
      
      <div className="container relative flex grow flex-col px-4">        
        <div className="mt-6 text-gray-400 md:text-lg">{children}</div>
        
      </div>
    </div>
  );
}