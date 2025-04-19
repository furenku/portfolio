import {ReactNode} from 'react';

type Props = {
  children?: ReactNode;
};

export default function HomeLayout({children}: Props) {
    

  return (
    <div className="relative flex grow flex-col bg-slate-850 py-36">
      
      <div className="container relative flex grow flex-col px-4">        
        <div className="mt-6 text-gray-400 md:text-lg">{children}</div>
        
      </div>
    </div>
  );
}