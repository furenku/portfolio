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

  const openFolderContextMenu = (event: React.MouseEvent, folderPath: string, folderName: string) => {
    event.preventDefault();
    console.log("Opening folder context menu:", { folderPath, folderName });
    setFolderContextMenu({
      x: event.clientX,
      y: event.clientY,
      path: folderPath,
      name: folderName
    });
  };

  const closeFolderContextMenu = useCallback(() => {
    console.log("Closing folder context menu");

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