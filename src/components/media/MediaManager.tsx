"use client";

import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { MediaToolbar } from './MediaToolbar';
import { FolderBrowser } from './FolderBrowser';
import { ImageGallery } from './ImageGallery';
import { CreateFolderModal } from './CreateFolderModal';
import { FolderContextMenu } from './FolderContextMenu';
import { useMediaData } from '@/hooks/media/useMediaData';
import { useImageSelection } from '@/hooks/media/useImageSelection';
import { useFolderNavigation } from '@/hooks/media/useFolderNavigation';
import { useImageDragState } from '@/hooks/media/useImageDragState';
import { useFolderContextMenu } from '@/hooks/media/useFolderContextMenu';
import { ViewMode } from '@/types/mediaGalleryTypes';
import { RenameFolderModal } from './RenameFolderModal'; // We'll create this component

export const MediaManager = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [folderToRename, setFolderToRename] = useState<string | null>(null);
  // Custom hooks
  const { loading, error, getCurrentFolder, createFolder, moveImages, refreshFolderStructure, renameFolder } = useMediaData();
  const { selectedImages, handleImageClick, clearSelectedImages } = useImageSelection();
  const { currentPath, navigateToFolder, navigateUp } = useFolderNavigation();
  const { isImageDragInProgress, handleActualImageDragStart, handleActualImageDragEnd } = useImageDragState();
  const { folderContextMenu, openFolderContextMenu, closeFolderContextMenu } = useFolderContextMenu();

  
  // Add a new handler for folder creation
  const handleCreateFolder = async (folderPath: string) => {
    const success = await createFolder(folderPath);
      if (success) {
      // Explicitly refresh the folder structure to ensure UI updates
      refreshFolderStructure();
      setShowCreateFolderModal(false);
      }
  };

  const handleOpenRenameFolder = (folderPath: string) => {
    setFolderToRename(folderPath);
    setShowRenameFolderModal(true);
    closeFolderContextMenu();
  };

  const handleRenameFolder = async (newName: string) => {
    if (folderToRename) {
      const success = await renameFolder(folderToRename, newName);
      if (success) {
        refreshFolderStructure();
        setShowRenameFolderModal(false);
        setFolderToRename(null);
      }
    }
  };


  // Handle moving selected images to a context menu folder
  const handleMoveSelectedToContextFolder = async () => {
    if (folderContextMenu && selectedImages.size > 0) {
      const imageIds = Array.from(selectedImages);
      const success = await moveImages(imageIds, folderContextMenu.path);
      if (success) {
        clearSelectedImages();
      }
      closeFolderContextMenu();
    }
  };

  const currentFolderData = getCurrentFolder(currentPath);
  const currentFolderImages = currentFolderData.images;
  const subFoldersInCurrentPath = Object.keys(currentFolderData.subFolders);

  if (loading) return <div className="flex justify-center p-8">Loading images...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;
  

  console.log("folderContextMenu state:", folderContextMenu);
  console.log("selectedImages:", selectedImages);

  return (
    <DndProvider backend={HTML5Backend}>
      {folderContextMenu && (
        <FolderContextMenu
          x={folderContextMenu.x}
          y={folderContextMenu.y}
          folderName={folderContextMenu.name}
          folderPath={folderContextMenu.path}
          itemCount={selectedImages.size}
          onMoveSelectedItems={handleMoveSelectedToContextFolder}
          onRenameFolder={handleOpenRenameFolder}
        />
      )}

      <div className={`p-4 ${isImageDragInProgress ? 'opacity-100 transition-opacity' : ''}`}>
        <MediaToolbar
          currentPath={currentPath}
          onNavigateUp={navigateUp}
          viewMode={viewMode}
          onSetViewMode={setViewMode}
          onShowCreateFolderModal={() => setShowCreateFolderModal(true)}
        />

        <FolderBrowser
          subFolders={subFoldersInCurrentPath}
          currentPath={currentPath}
          onFolderClick={navigateToFolder}
          onNavigateUp={navigateUp}
          onDropItemToFolder={moveImages}
          onContextMenuOpen={openFolderContextMenu}
          selectedItemCount={selectedImages.size}
        />

        <ImageGallery
          images={currentFolderImages}
          selectedImageIds={selectedImages}
          viewMode={viewMode}
          onImageClick={handleImageClick}
          onImageDragStart={handleActualImageDragStart}
          onImageDragEnd={handleActualImageDragEnd}
          isGloballyDragging={isImageDragInProgress}
        />

        <CreateFolderModal
          isOpen={showCreateFolderModal}
          onClose={() => setShowCreateFolderModal(false)}
          onCreateFolder={handleCreateFolder}
          currentPath={currentPath}
        />

        {showRenameFolderModal && folderToRename && (
          <RenameFolderModal
            isOpen={showRenameFolderModal}
            onClose={() => setShowRenameFolderModal(false)}
            onRenameFolder={handleRenameFolder}
            folderPath={folderToRename}
          />
        )}
      </div>
    </DndProvider>
  );
};
