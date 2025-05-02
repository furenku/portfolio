export type Breakpoint = 'preview' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';


export type ImageSize = { src: string; width: number; height: number };


export type Dimensions = {
  width: number;
  height: number;
};


export interface ApiImage extends Dimensions {
  id: number | string;
  src: string;
  alt: string;
  caption: string;
  sizes: {
    [key in Breakpoint]: ImageSize
  };  
  preview: string;
  filename: string;
  created_at: string;
  path?: string;
};