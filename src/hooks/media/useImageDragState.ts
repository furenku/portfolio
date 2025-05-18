"use client";

import { useState, useCallback } from 'react';

export const useImageDragState = () => {
  const [isImageDragInProgress, setIsImageDragInProgress] = useState(false);
  const [currentlyDraggedImageIds, setCurrentlyDraggedImageIds] = useState<string[]>([]);

  const handleActualImageDragStart = useCallback((draggedIds: string[]) => {
    setIsImageDragInProgress(true);
    setCurrentlyDraggedImageIds(draggedIds);
  }, []);

  const handleActualImageDragEnd = useCallback(() => {
    setIsImageDragInProgress(false);
    setCurrentlyDraggedImageIds([]);
  }, []);

  return {
    isImageDragInProgress,
    currentlyDraggedImageIds,
    handleActualImageDragStart,
    handleActualImageDragEnd,
  };
};