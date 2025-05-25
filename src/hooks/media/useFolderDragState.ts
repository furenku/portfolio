"use client";

import { useState } from 'react';

export const useFolderDragState = () => {
  const [isFolderDragInProgress, setIsFolderDragInProgress] = useState(false);

  const handleFolderDragStart = () => {
    setIsFolderDragInProgress(true);
  };

  const handleFolderDragEnd = () => {
    setIsFolderDragInProgress(false);
  };

  return {
    isFolderDragInProgress,
    handleFolderDragStart,
    handleFolderDragEnd
  };
};