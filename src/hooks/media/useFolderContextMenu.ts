"use client";

import { useState, useCallback, useEffect } from 'react';

interface FolderContextMenuState {
  x: number;
  y: number;
  path: string;
  name: string;
}

export const useFolderContextMenu = () => {
  const [folderContextMenu, setFolderContextMenu] = useState<FolderContextMenuState | null>(null);

  const openFolderContextMenu = useCallback((event: React.MouseEvent, path: string, name: string) => {
    event.preventDefault();
    setFolderContextMenu({ x: event.clientX, y: event.clientY, path, name });
  }, []);

  const closeFolderContextMenu = useCallback(() => {
    setFolderContextMenu(null);
  }, []);

  useEffect(() => {
    if (folderContextMenu) {
      const handleClickOutside = () => {
        closeFolderContextMenu();
      };

      window.addEventListener('click', handleClickOutside);
      window.addEventListener('contextmenu', handleClickOutside, { capture: true });

      return () => {
        window.removeEventListener('click', handleClickOutside);
        window.removeEventListener('contextmenu', handleClickOutside, { capture: true });
      };
    }
  }, [folderContextMenu, closeFolderContextMenu]);

  return {
    folderContextMenu,
    openFolderContextMenu,
    closeFolderContextMenu,
  };
};