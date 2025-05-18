"use client";

import { useState, useCallback } from 'react';

export const useFolderNavigation = () => {
  const [currentPath, setCurrentPath] = useState<string>('');

  const navigateToPath = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const navigateToFolder = useCallback((folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  }, [currentPath]);

  const navigateUp = useCallback(() => {
    if (!currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  }, [currentPath]);

  return {
    currentPath,
    navigateToPath,
    navigateToFolder,
    navigateUp,
  };
};