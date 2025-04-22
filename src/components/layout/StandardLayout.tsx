import {ReactNode} from 'react';

type Props = {
  view?: 'fullscreen';
  children?: ReactNode;
};

export default function StandardLayout({view, children}: Props) {
    

  return (
    <div className="relative flex grow flex-col bg-slate-850 py-36">
      
      <div className={ view === 'fullscreen' ? "" : "container" + " relative flex grow flex-col px-4 mx-auto"}>        
        <div className="w-full mt-6 text-gray-400 md:text-lg">{children}</div>
        
      </div>
    </div>
  );
}