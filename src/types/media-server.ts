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
  folder_id: number | null;
};


export interface Image {
  id: number;
  filename: string;
  src: string;
  sizes: Record<string, any>;
  created_at: string;
  alt_text?: string;
  caption?: string;
  folder_id?: number;
  path?: string;
}

export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  created_at?: string;
  updated_at?: string;
}
