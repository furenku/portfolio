"use client";

import React from 'react';
import { ApiImage } from '@/types/media-server';
import { ViewMode } from '@/types/mediaGalleryTypes';
import { ImageItem } from './ImageItem';

interface ImageGalleryProps {
  images: ApiImage[];
  selectedImageIds: Set<string>;
  viewMode: ViewMode;
  onImageClick: (e: React.MouseEvent, image: ApiImage) => void;
  onImageDragStart: (draggedIds: string[]) => void;
  onImageDragEnd: () => void;
  isGloballyDragging: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  selectedImageIds,
  viewMode,
  onImageClick,
  onImageDragStart,
  onImageDragEnd,
  isGloballyDragging,
}) => {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium mb-2">
        Images {images.length > 0 && `(${images.length})`}
      </h3>
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2'
            : 'flex flex-col'
        }
      >
        {images.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No images in this folder.
          </div>
        ) : (
          images.map(image => (
            <ImageItem
              key={image.id}
              image={image}
              isSelected={selectedImageIds.has(image.id.toString())}
              onClick={onImageClick}
              viewMode={viewMode}
              onActualDragStart={onImageDragStart}
              onActualDragEnd={onImageDragEnd}
              selectedImageIds={selectedImageIds}
              isGloballyDragging={isGloballyDragging}
            />
          ))
        )}
      </div>
    </div>
  );
};