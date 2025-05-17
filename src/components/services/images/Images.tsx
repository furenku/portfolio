"use client";

import React, { useState, useEffect } from 'react';
import { ImageContainer } from '@/components/ImageContainer';
import { ApiImage } from '@/types/media-server';
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

// ======================
// ImageItem: Draggable image card
    const ImageItem = ({
        image,
        isSelected,
        onClick,
        viewMode,
        onDragStart,
        onDragEnd,
      }: {
        image: ApiImage;
        isSelected: boolean;
        onClick: (e: React.MouseEvent, image: ApiImage) => void;
        viewMode: ViewMode;
        onDragStart: () => void;
        onDragEnd: () => void;
      }) => {
        const [{ isDragging }, drag] = useDrag(() => ({
          type: 'IMAGE',
          item: () => {
            onDragStart();                         // <--- Move `onDragStart` into item()
            return { id: image.id, image };
          },
          collect: monitor => ({
            isDragging: !!monitor.isDragging(),
          }),
          end: () => {
            onDragEnd();
          },
    }), [image, onDragStart, onDragEnd]);      // <--- Make sure dependencies are included
      

  return (
    <div
      ref={drag as unknown as React.RefCallback<HTMLDivElement>}
      className={`
        ${viewMode === 'grid' ? 'w-40 h-40 m-2' : 'w-full h-20 my-1 flex items-center'}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        cursor-pointer relative overflow-hidden rounded-md shadow-sm transition-all
      `}
      onClick={(e) => onClick(e, image)}
      style={{ zIndex: isDragging ? 50 : 'auto' }}
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
// Folder: Drop target for images
const Folder = ({
  name,
  isActive,
  onClick,
  onDrop,
  highlight,
}: {
  name: string;
  isActive: boolean;
  onClick: () => void;
  onDrop: (imageId: string) => void;
  highlight?: boolean;
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'IMAGE',
    drop: (item: { id: string }) => {
      onDrop(item.id);
      return { name };
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [onDrop, name]);

  return (
    <div
      ref={drop as unknown as React.RefCallback<HTMLDivElement>}
      className={`
        flex items-center p-2 my-1 rounded-md cursor-pointer transition
        ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}
        ${isOver || highlight ? 'bg-blue-200' : ''}
        border border-dashed ${isOver ? 'border-blue-500' : 'border-transparent'}
      `}
      onClick={onClick}
      style={{ fontWeight: isActive ? 700 : 400 }}
    >
      <FolderIcon className="w-5 h-5 mr-2 text-blue-500" />
      <span className="truncate">{name}</span>
    </div>
  );
};

// ======================
// CreateFolderModal
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [folderStructure, setFolderStructure] = useState<FolderStructure>({
    root: { images: [], subFolders: {} },
  });
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/images');
        if (!response.ok) throw new Error('Failed to fetch images');
        const data: ApiImage[] = await response.json();
        setImages(data);
        organizeImagesIntoFolders(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  // Build folders structure
  const organizeImagesIntoFolders = (imageList: ApiImage[]) => {
    const structure: FolderStructure = {
      root: { images: [], subFolders: {} },
    };
    imageList.forEach(image => {
      const path = image.path || '';
      if (!path) {
        structure.root.images.push(image);
        return;
      }
      const folders = path.split('/').filter(Boolean);
      let currentLevel = structure.root;
      folders.forEach((folder, idx) => {
        if (!currentLevel.subFolders[folder]) {
          currentLevel.subFolders[folder] = { images: [], subFolders: {} };
        }
        currentLevel = currentLevel.subFolders[folder];
        if (idx === folders.length - 1) {
          currentLevel.images.push(image);
        }
      });
    });
    setFolderStructure(structure);
  };

  // Get current folder
  const getCurrentFolder = (): FolderNode => {
    if (!currentPath) return folderStructure.root;
    const folders = currentPath.split('/').filter(Boolean);
    let current = folderStructure.root;
    for (const folder of folders) {
      if (!current.subFolders[folder]) return { images: [], subFolders: {} };
      current = current.subFolders[folder];
    }
    return current;
  };

  // Select image
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

  // Go to subfolder
  const handleFolderClick = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
    setSelectedImages(new Set());
  };

  // Go up
  const handleNavigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
    setSelectedImages(new Set());
  };

  // Create folder
  const handleCreateFolder = async (folderPath: string) => {
    try {
      const response = await fetch('/api/images/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath }),
      });

      if (!response.ok) throw new Error('Failed to create folder');
      // Update local folder structure
      const newStructure = { ...folderStructure };
      const folders = folderPath.split('/').filter(Boolean);
      let current = newStructure.root;
      for (const folder of folders) {
        if (!current.subFolders[folder]) {
          current.subFolders[folder] = { images: [], subFolders: {} };
        }
        current = current.subFolders[folder];
      }
      setFolderStructure(newStructure);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Move ONE image into a folder
  const handleMoveToFolder = async (imageId: string, targetPath: string) => {
    try {
      const response = await fetch('/api/images/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: [imageId], targetPath }),
      });
      if (!response.ok) throw new Error('Failed to move image');
      // Update local state
      const updatedImages = images.map(img =>
        img.id === imageId ? { ...img, path: targetPath } : img
      );
      setImages(updatedImages);
      organizeImagesIntoFolders(updatedImages);
      setSelectedImages(prev => {
        const newSelection = new Set(prev);
        newSelection.delete(imageId);
        return newSelection;
      });
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Bulk move selected images into current folder
  const handleBulkMove = async () => {
    if (selectedImages.size === 0) return;
    try {
      const imageIds = Array.from(selectedImages);
      const response = await fetch('/api/images/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds, targetPath: currentPath }),
      });
      if (!response.ok) throw new Error('Failed to move images');
      const updatedImages = images.map(img =>
        selectedImages.has((img.id).toString())
          ? { ...img, path: currentPath }
          : img
      );
      setImages(updatedImages);
      organizeImagesIntoFolders(updatedImages);
      setSelectedImages(new Set());
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // === Render ===
  const currentFolder = getCurrentFolder();
  const currentFolderImages = currentFolder.images;
  const subFolders = Object.keys(currentFolder.subFolders);

  if (loading) return <div className="flex justify-center p-8">Loading images...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Overlay: SHOW WHILE DRAGGING */}
      {isDragging && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-200/40"></div>
          <div className="relative z-10 font-bold text-blue-700 text-2xl animate-pulse">
            Dragging image...
          </div>
        </div>
      )}

      <div className={`p-4 ${isDragging ? 'opacity-60 transition' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold">Images</h2>
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
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-200' : ''}`}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-200' : ''}`}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateFolderModal(true)}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md"
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              New Folder
            </button>
          </div>
        </div>

        {/* Folders */}
        {subFolders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Folders</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {subFolders.map(folder => (
                <Folder
                  key={folder}
                  name={folder}
                  isActive={false}
                  onClick={() => handleFolderClick(folder)}
                  onDrop={imageId =>
                    handleMoveToFolder(imageId, currentPath ? `${currentPath}/${folder}` : folder)
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* BULK MOVE BUTTON */}
        {selectedImages.size > 0 && (
          <div className="mb-4">
            <button
              onClick={handleBulkMove}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
            >
              Move selected images here ({selectedImages.size})
            </button>
          </div>
        )}

        {/* Images */}
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">
            Images {currentFolderImages.length > 0 && `(${currentFolderImages.length})`}
          </h3>
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2'
                : 'flex flex-col'
            }
          >
            {currentFolderImages.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                No images in this folder
              </div>
            ) : (
              currentFolderImages.map(image => (
                <ImageItem
                  key={image.id}
                  image={image}
                  isSelected={selectedImages.has(image.id.toString())}
                  onClick={handleImageClick}
                  viewMode={viewMode}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                />
              ))
            )}
          </div>
        </div>

        {/* Modal */}
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