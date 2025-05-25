"use client";

import { useState, useEffect, useCallback } from 'react';
import { ApiImage, Folder } from '@/types/media-server';
import { FolderStructure, FolderNode } from '@/types/mediaGalleryTypes';

export const useMediaData = () => {
  const [images, setImages] = useState<ApiImage[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({
    root: { images: [], subFolders: {} },
  });

const organizeImagesIntoFolders = useCallback((imageList: ApiImage[], folderList: Folder[]) => {
  const structure: FolderStructure = {
    root: { images: [], subFolders: {} },
  };
  const folderMap = new Map<number, Folder>();
  folderList.forEach(folder => folderMap.set(folder.id, folder));

  const getFolderPath = (folderId: number | null): string => {
    if (folderId === null) return '';
    const folder = folderMap.get(folderId);
    if (!folder) return '';
    const parentPath = getFolderPath(folder.parent_id || null);
    return parentPath ? `${parentPath}/${folder.name}` : folder.name;
  };

  folderList.forEach(folder => {
    const path = getFolderPath(folder.id);
    if (!path) return;
    
    const parts = path.split('/');
    let current = structure.root;
    for (const part of parts) {
      if (!current.subFolders[part]) {
        current.subFolders[part] = { images: [], subFolders: {} };
      }
      current = current.subFolders[part];
    }
  });

  imageList.forEach(image => {
    const folderId = image.folder_id;
    if (!folderId) {
      structure.root.images.push(image);
      return;
    }
    
    const folderPath = getFolderPath(folderId);
    console.log(folderPath);
    
    if (!folderPath) {
      structure.root.images.push(image);
      return;
    }
    
    const pathParts = folderPath.split('/').filter(Boolean);
    let currentLevel = structure.root;
    
    for (let i = 0; i < pathParts.length; i++) {
      const folderName = pathParts[i];
      if (!currentLevel.subFolders[folderName]) {
        currentLevel.subFolders[folderName] = { images: [], subFolders: {} };
      }
      currentLevel = currentLevel.subFolders[folderName];
      
      if (i === pathParts.length - 1) {
        currentLevel.images.push(image);
      }
    }
  });
  
  setFolderStructure(structure);
}, []);

  const refreshData = useCallback(async () => {
        const [imagesResponse, foldersResponse] = await Promise.all([
          fetch('/api/images'),
          fetch('/api/images/folders')
        ]);
      if (!imagesResponse.ok || !foldersResponse.ok) {
        throw new Error('Failed to refresh data');
      }
      
      const imagesData: ApiImage[] = await imagesResponse.json();
      const foldersData: Folder[] = await foldersResponse.json();
      
      setImages(imagesData);
      setFolders(foldersData);
      organizeImagesIntoFolders(imagesData, foldersData);
  }, [organizeImagesIntoFolders]);
      
  const refreshFolderStructure = useCallback(() => {
    organizeImagesIntoFolders(images, folders);
  }, [images, folders, organizeImagesIntoFolders]);

  const getCurrentFolder = useCallback((path: string): FolderNode => {
    if (!path) return folderStructure.root;
    const foldersToTraverse = path.split('/').filter(Boolean);
    let current = folderStructure.root;
    for (const folder of foldersToTraverse) {
      if (!current.subFolders[folder]) return { images: [], subFolders: {} };
      current = current.subFolders[folder];
    }
    return current;
  }, [folderStructure]);

  useEffect(() => {
    const fetchData = async () => {
    try {
        setLoading(true);
        await refreshData();
    } catch (err) {
      setError((err as Error).message);
      } finally {
        setLoading(false);
    }
  };
    fetchData();
  }, [refreshData]);
  
  const createFolder = async (folderPath: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/images/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath }),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      
      await refreshData();
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const renameFolder = async (folderPath: string, newName: string) => {
    try {
      const response = await fetch('/api/images/folders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderPath,
          newName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error renaming folder:', errorData);
        return false;
      }

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error renaming folder:', error);
      return false;
    }
  };

  const moveFolder = async (source: string, target: string): Promise<boolean> => {
    console.log('Moving folder:', source, 'to', target);
    
    try {
      const response = await fetch('/api/images/folders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
          target
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error moving folder:', errorData);
        setError(errorData.error || 'Failed to move folder');
        return false;
      }

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error moving folder:', error);
      setError((error as Error).message);
      return false;
    }
  };

  const deleteFolder = async (folderPath: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/images/folders', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPath }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to delete folder');
        return false;
      }

      await refreshData();

      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      setError('Network error while deleting folder');
      return false;
    }
  };

  const moveImages = async (imageIds: string[], targetPath: string) => {
    if (imageIds.length === 0) return;
    try {
      let targetFolderId: number | null = null;
      if (targetPath) {
        const targetFolder = folders.find(folder => {
          const folderPath = getFolderPath(folder.id);
          return folderPath === targetPath;
        });
        targetFolderId = targetFolder?.id || null;
      }
  
      const response = await fetch('/api/images/move', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds, folderId: targetFolderId }),
      });
      if (!response.ok) throw new Error(`Failed to move ${imageIds.length > 1 ? 'images' : 'image'}`);
      
      const updatedImages = images.map(img =>
        imageIds.includes(img.id.toString()) ? { ...img, folder_id: targetFolderId } : img
      );
      setImages(updatedImages);
      organizeImagesIntoFolders(updatedImages, folders);
      
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  const getFolderPath = useCallback((folderId: number | null): string => {
    if (folderId === null) return '';
    const folderMap = new Map<number, Folder>();
    folders.forEach(folder => folderMap.set(folder.id, folder));
    
    const folder = folderMap.get(folderId);
    if (!folder) return '';
    const parentPath = getFolderPath(folder.parent_id || null);
    return parentPath ? `${parentPath}/${folder.name}` : folder.name;
  }, [folders]);

  return {
    images,
    folders,
    folderStructure,
    loading,
    error,
    getCurrentFolder,
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolder,
    refreshFolderStructure,
    moveImages,
  };
};
