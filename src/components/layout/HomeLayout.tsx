import { ReactNode } from 'react';
import { GalleryImage } from '../Gallery';

type Props = {
  images: GalleryImage[]
  children?: ReactNode;
};

export default function HomeLayout({ images, children }: Props) {
    
  console.log( images )

  return (
    <div className="relative flex grow flex-col bg-slate-850 py-36">
      
      <div className="container relative flex grow flex-col px-4">        
        <div className="mt-6 text-gray-400 md:text-lg">{children}</div>
        
      </div>
    </div>
  );
}