"use client";

import { useState, useCallback } from 'react';
import { ApiImage } from '@/types/media-server';

export const useImageSelection = () => {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const handleImageClick = useCallback((e: React.MouseEvent, image: ApiImage) => {
    const idStr = String(image.id);
    if (e.ctrlKey || e.metaKey) {
      setSelectedImages(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(idStr)) newSelection.delete(idStr);
        else newSelection.add(idStr);
        return newSelection;
      });
    } else {
      setSelectedImages(new Set([idStr]));
    }
  }, []);

  const clearSelectedImages = useCallback(() => {
    setSelectedImages(new Set());
  }, []);

  return {
    selectedImages,
    handleImageClick,
    clearSelectedImages,
    setSelectedImages,
  };
};