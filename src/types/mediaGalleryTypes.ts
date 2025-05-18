import { ApiImage } from './media-server';

export type ViewMode = 'grid' | 'list';

export interface FolderNode {
  images: ApiImage[];
  subFolders: { [key: string]: FolderNode };
}

export interface FolderStructure {
  root: FolderNode;
}

export interface ImageDragItem {
  imageIds: string[];
  representativeImageSrc?: string;
  type: 'IMAGE_COLLECTION';
}