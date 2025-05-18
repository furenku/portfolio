"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ImageContainer } from '@/components/ImageContainer';
import { ApiImage, Folder as FolderType } from '@/types/media-server'; // Ensure this type is defined
import { FolderIcon, Squares2X2Icon, ListBulletIcon, PlusIcon } from '@heroicons/react/24/outline';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Types for folder structure
type FolderNode = {
  images: ApiImage[];
  subFolders: { [key: string]: FolderNode };
};
type FolderStructure = { root: FolderNode };
type ViewMode = 'grid' | 'list';

// Drag item type for images
interface ImageDragItem {
  imageIds: string[];
  representativeImageSrc?: string; // Optional: for custom drag preview
  type: 'IMAGE_COLLECTION';
}

// ======================
// ImageItem: Draggable image card
const ImageItem = ({
  image,
  isSelected,
  onClick,
  viewMode,
  onActualDragStart, // Renamed from onDragStart to avoid confusion
  onActualDragEnd,   // Renamed from onDragEnd
  selectedImageIds, // Pass all selected image IDs
  isGloballyDragging, // Pass global dragging state for styling non-source selected items
}: {
  image: ApiImage;
  isSelected: boolean;
  onClick: (e: React.MouseEvent, image: ApiImage) => void;
  viewMode: ViewMode;
  onActualDragStart: (draggedIds: string[]) => void;
  onActualDragEnd: () => void;
  selectedImageIds: Set<string>;
  isGloballyDragging: boolean;
}) => {
  const [{ isDragging: isDragSource }, drag] = useDrag<ImageDragItem, void, { isDragging: boolean }>(() => ({
    type: 'IMAGE_COLLECTION',
    item: () => {
      const imageIdStr = image.id.toString();
      // If the current image is selected, drag all selected images.
      // Otherwise, drag only the current image.
      const idsToDrag = selectedImageIds.has(imageIdStr) && selectedImageIds.size > 0
        ? Array.from(selectedImageIds)
        : [imageIdStr];
      
      onActualDragStart(idsToDrag);
      return {
        imageIds: idsToDrag,
        representativeImageSrc: image.sizes.sm?.src || image.src,
        type: 'IMAGE_COLLECTION'
      };
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: () => {
      onActualDragEnd();
    },
  }), [image, selectedImageIds, onActualDragStart, onActualDragEnd]); // Dependencies

  // An item is effectively being dragged if it's the source or if it's selected and a global drag is in progress.
  const isEffectivelyDragging = isDragSource || (isGloballyDragging && isSelected);

  return (
    <div
      ref={drag as unknown as React.RefCallback<HTMLDivElement>}
      className={`
        ${viewMode === 'grid' ? 'w-40 h-40 m-2' : 'w-full h-20 my-1 flex items-center'}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isEffectivelyDragging ? 'opacity-50' : 'opacity-100'}
        cursor-pointer relative overflow-hidden rounded-md shadow-sm transition-all
      `}
      onClick={(e) => onClick(e, image)}
      style={{ zIndex: isDragSource ? 50 : 'auto' }} // Ensure drag source is on top
    >
      <div className={`relative ${viewMode === 'grid' ? 'h-32' : 'h-full w-24 mr-4'}`}>
        <ImageContainer
          src={image.sizes.sm?.src || image.src}
          alt={image.alt || image.filename}
          blurDataURL={image.preview || ''}
        />
      </div>
      {viewMode === 'list' && (
        <div className="flex-1 truncate">
          <p className="font-medium truncate">{image.filename}</p>
          <p className="text-sm text-gray-500 truncate">
            {image.path || 'No folder'}
          </p>
        </div>
      )}
      {viewMode === 'grid' && (
        <p className="text-xs truncate p-1 text-center bg-white bg-opacity-70">
          {image.filename}
        </p>
      )}
    </div>
  );
};

// ======================
// Folder: Drop target for images and context menu source
const Folder = ({
  name,
  path, // Full path of the folder
  isActive,
  onClick,
  onDrop, // Now accepts an array of image IDs
  onContextMenuOpen, // For opening custom context menu
  selectedItemCount, // To enable/disable context menu option
  highlight,
}: {
  name: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
  onDrop: (imageIds: string[]) => void;
  onContextMenuOpen: (event: React.MouseEvent, folderPath: string, folderName: string) => void;
  selectedItemCount: number;
  highlight?: boolean;
}) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'IMAGE_COLLECTION',
    drop: (item: ImageDragItem) => { // Expecting ImageDragItem
      onDrop(item.imageIds);
      return { name }; // name of the drop target (folder)
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [onDrop, name, path]); // Added path to dependencies if onDrop depends on it closure-wise

  const handleContextMenu = (e: React.MouseEvent) => {
    if (selectedItemCount > 0) { // Only open context menu if items are selected
      e.preventDefault();
      onContextMenuOpen(e, path, name);
    }
    // If selectedItemCount is 0, allow default context menu or do nothing.
  };

  return (
    <div
      ref={drop as unknown as React.RefCallback<HTMLDivElement>}
      className={`
        flex items-center p-2 my-1 rounded-md cursor-pointer transition
        ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}
        ${isOver && canDrop ? 'bg-blue-200 ring-2 ring-blue-500' : ''}
        ${highlight ? 'bg-blue-200' : ''}
        border border-dashed ${isOver && canDrop ? 'border-blue-500' : 'border-transparent'}
      `}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      style={{ fontWeight: isActive ? 700 : 400 }}
    >
      <FolderIcon className="w-5 h-5 mr-2 text-blue-500" />
      <span className="truncate">{name}</span>
    </div>
  );
};

// ======================
// CreateFolderModal (no changes needed for this refactor)
const CreateFolderModal = ({
  isOpen,
  onClose,
  onCreateFolder,
  currentPath,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (path: string) => void;
  currentPath: string;
}) => {
  const [folderName, setFolderName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
      onCreateFolder(newPath);
      setFolderName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h3 className="text-lg font-medium mb-4">Create New Folder</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter folder name"
              autoFocus
            />
            {currentPath && (
              <p className="text-sm text-gray-500 mt-1">
                Will be created in: {currentPath}
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-600"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ======================
// Main Images Component
export const Images = () => {
  const [images, setImages] = useState<ApiImage[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({
    root: { images: [], subFolders: {} },
  });
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  
  // New state for drag operations
  const [isImageDragInProgress, setIsImageDragInProgress] = useState(false);
  const [currentlyDraggedImageIds, setCurrentlyDraggedImageIds] = useState<string[]>([]);

  // New state for folder context menu
  const [folderContextMenu, setFolderContextMenu] = useState<{ x: number; y: number; path: string; name: string } | null>(null);

  // Fetch images and folders
  

  // Organize images (memoized with useCallback if imageList/folderList are stable, or just keep as is)
  const organizeImagesIntoFolders = useCallback((imageList: ApiImage[], folderList: FolderType[]) => {
    const structure: FolderStructure = {
      root: { images: [], subFolders: {} },
    };
    const folderMap = new Map<number, FolderType>();
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
      const path = image.path || '';
      if (!path) {
        structure.root.images.push(image);
        return;
      }
      const foldersInPath = path.split('/').filter(Boolean);
      let currentLevel = structure.root;
      for (let i = 0; i < foldersInPath.length; i++) {
        const folderName = foldersInPath[i];
        if (!currentLevel.subFolders[folderName]) {
          currentLevel.subFolders[folderName] = { images: [], subFolders: {} };
        }
        currentLevel = currentLevel.subFolders[folderName];
        if (i === foldersInPath.length - 1) {
          currentLevel.images.push(image);
        }
      }
    });
    setFolderStructure(structure);
  }, [setFolderStructure]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [imagesResponse, foldersResponse] = await Promise.all([
          fetch('/api/images'),
          fetch('/api/images/folders')
        ]);
        if (!imagesResponse.ok) throw new Error('Failed to fetch images');
        if (!foldersResponse.ok) throw new Error('Failed to fetch folders');
        const imagesData: ApiImage[] = await imagesResponse.json();
        const foldersData: FolderType[] = await foldersResponse.json();
        setImages(imagesData);
        setFolders(foldersData);
        organizeImagesIntoFolders(imagesData, foldersData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [organizeImagesIntoFolders]);
  
  // Get current folder (memoized with useCallback if dependencies are stable)
  const getCurrentFolder = useCallback((): FolderNode => {
    if (!currentPath) return folderStructure.root;
    const foldersToTraverse = currentPath.split('/').filter(Boolean);
    let current = folderStructure.root;
    for (const folder of foldersToTraverse) {
      if (!current.subFolders[folder]) return { images: [], subFolders: {} }; // Should ideally not happen if paths are correct
      current = current.subFolders[folder];
    }
    return current;
  }, [currentPath, folderStructure]);

  const handleImageClick = (e: React.MouseEvent, image: ApiImage) => {
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
  };

  const handleFolderClick = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    setSelectedImages(new Set());
    setFolderContextMenu(null); // Close context menu on navigation
  };

  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
    setSelectedImages(new Set());
    setFolderContextMenu(null); // Close context menu
  };

  const handleCreateFolder = async (folderPath: string) => {
    try {
      const response = await fetch('/api/images/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath }),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      const newFolderData = await response.json(); // Assuming API returns the new folder
      
      // Update folders state and re-organize
      // This part assumes newFolderData is compatible with FolderType
      setFolders(prevFolders => [...prevFolders, newFolderData as FolderType]);
      organizeImagesIntoFolders(images, [...folders, newFolderData as FolderType]);

    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Refactored: Handles moving one or more images to a specific path
  const handleMoveImagesToPath = useCallback(async (imageIdsToMove: string[], targetPath: string) => {
    if (imageIdsToMove.length === 0) return;
    try {
      const response = await fetch('/api/images/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: imageIdsToMove, targetPath }),
      });
      if (!response.ok) throw new Error(`Failed to move ${imageIdsToMove.length > 1 ? 'images' : 'image'}`);
      
      const updatedImages = images.map(img =>
        imageIdsToMove.includes(img.id.toString()) ? { ...img, path: targetPath } : img
      );
      setImages(updatedImages);
      organizeImagesIntoFolders(updatedImages, folders); // Re-organize
      
      // Clear moved images from selection
      setSelectedImages(prev => {
        const newSelection = new Set(prev);
        imageIdsToMove.forEach(id => newSelection.delete(id));
        return newSelection;
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }, [images, folders, setImages, setSelectedImages, setError, organizeImagesIntoFolders]);
  
  // Bulk move selected images to the CURRENT folder (kept for existing button, if any)
  // Consider removing if all moves go through handleMoveImagesToPath
  

  // Drag Handlers for ImageItem
  const handleActualImageDragStart = useCallback((draggedIds: string[]) => {
    setIsImageDragInProgress(true);
    setCurrentlyDraggedImageIds(draggedIds);
  }, []);

  const handleActualImageDragEnd = useCallback(() => {
    setIsImageDragInProgress(false);
    setCurrentlyDraggedImageIds([]);
  }, []);

  // Context Menu Handlers for Folder
  const handleFolderContextMenuOpen = useCallback((event: React.MouseEvent, path: string, name: string) => {
    event.preventDefault();
    if (selectedImages.size > 0) {
      setFolderContextMenu({ x: event.clientX, y: event.clientY, path, name });
    }
  }, [selectedImages.size]);

  const handleCloseContextMenu = useCallback(() => {
    setFolderContextMenu(null);
  }, []);

  const handleMoveSelectedToContextFolder = useCallback(async () => {
    if (folderContextMenu && selectedImages.size > 0) {
      const imageIds = Array.from(selectedImages);
      await handleMoveImagesToPath(imageIds, folderContextMenu.path);
      handleCloseContextMenu();
    }
  }, [folderContextMenu, selectedImages, handleMoveImagesToPath, handleCloseContextMenu]); // Added dependencies

  useEffect(() => {
    if (folderContextMenu) {
      const close = () => {
        // Check if the click is outside the context menu if it's rendered
        // For simplicity, this closes on any window click.
        // More robust solution would check e.target.
        handleCloseContextMenu();
      };
      window.addEventListener('click', close);
      window.addEventListener('contextmenu', close, { capture: true }); // Close on another right click
      return () => {
        window.removeEventListener('click', close);
        window.removeEventListener('contextmenu', close, { capture: true });
      };
    }
  }, [folderContextMenu, handleCloseContextMenu]);


  const currentFolderData = getCurrentFolder();
  const currentFolderImages = currentFolderData.images;
  const subFoldersInCurrentPath = Object.keys(currentFolderData.subFolders);

  if (loading) return <div className="flex justify-center p-8">Loading images...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Global Drag Overlay */}
      {isImageDragInProgress && (
        <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-200/40"></div>
          <div className="relative z-10 font-bold text-blue-700 text-2xl animate-pulse">
            Dragging {currentlyDraggedImageIds.length} item(s)...
          </div>
        </div>
      )}

      {/* Folder Context Menu */}
      {folderContextMenu && selectedImages.size > 0 && (
        <div
          style={{ top: folderContextMenu.y, left: folderContextMenu.x, position: 'fixed', zIndex: 150 }}
          className="bg-white shadow-lg rounded-md py-1 border border-gray-200 min-w-[200px]"
          onClick={(e) => e.stopPropagation()} // Prevent click inside from closing immediately
        >
          <button
            onClick={handleMoveSelectedToContextFolder}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            Move {selectedImages.size} item(s) to "{folderContextMenu.name}"
          </button>
        </div>
      )}

      <div className={`p-4 ${isImageDragInProgress ? 'opacity-60 transition-opacity' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            
            {currentPath && (
              <div className="flex items-center ml-4">
                <button
                  onClick={handleNavigateUp}
                  className="text-blue-500 hover:underline mr-2"
                >
                  <span className="text-gray-400">&#8592; Up</span>
                </button>
                <span className="mx-2 text-gray-500">/</span>
                <span className="font-medium">{currentPath}</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} aria-label="Grid view"><Squares2X2Icon className="w-5 h-5" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} aria-label="List view"><ListBulletIcon className="w-5 h-5" /></button>
            <button onClick={() => setShowCreateFolderModal(true)} className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"><PlusIcon className="w-4 h-4 mr-1" /> New Folder</button>
          </div>
        </div>

        {/* Always show folders area, with .. only if not in root */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Folders</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {/* Show parent in all subfolders */}
            {currentPath && (
              <Folder
                key=".."
                name=".."
                path={
                  currentPath
                    .split('/')
                    .filter(Boolean)
                    .slice(0, -1)
                    .join('/')
                }
                isActive={false}
                onClick={handleNavigateUp}
                onDrop={(droppedImageIds) =>
                  handleMoveImagesToPath(
                    droppedImageIds,
                    currentPath
                      .split('/')
                      .filter(Boolean)
                      .slice(0, -1)
                      .join('/')
                  )
                }
                onContextMenuOpen={handleFolderContextMenuOpen}
                selectedItemCount={selectedImages.size}
              />
            )}
            {/* Root or subfolders */}
            {subFoldersInCurrentPath.map(folderName => {
              const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
              return (
                <Folder
                  key={folderPath}
                  name={folderName}
                  path={folderPath}
                  isActive={false}
                  onClick={() => handleFolderClick(folderName)}
                  onDrop={(droppedImageIds) => handleMoveImagesToPath(droppedImageIds, folderPath)}
                  onContextMenuOpen={handleFolderContextMenuOpen}
                  selectedItemCount={selectedImages.size}
                />
              );
            })}
          </div>
        </div>


        

        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">
            Images {currentFolderImages.length > 0 && `(${currentFolderImages.length})`}
          </h3>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2'
                : 'flex flex-col'
            }
          >
            {currentFolderImages.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No images in this folder.
              </div>
            ) : (
              currentFolderImages.map(image => (
                <ImageItem
                  key={image.id}
                  image={image}
                  isSelected={selectedImages.has(image.id.toString())}
                  onClick={handleImageClick}
                  viewMode={viewMode}
                  onActualDragStart={handleActualImageDragStart}
                  onActualDragEnd={handleActualImageDragEnd}
                  selectedImageIds={selectedImages}
                  isGloballyDragging={isImageDragInProgress}
                />
              ))
            )}
          </div>
        </div>

        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
          onCreateFolder={handleCreateFolder}
          currentPath={currentPath}
        />
      </div>
    </DndProvider>
  );
};