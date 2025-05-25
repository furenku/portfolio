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
import { useFolderDragState } from '@/hooks/media/useFolderDragState'; // We'll create this hook

export const MediaManager = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [folderToRename, setFolderToRename] = useState<string | null>(null);
  // Custom hooks
  const { loading, error, getCurrentFolder, createFolder, moveImages, renameFolder, moveFolder, deleteFolder } = useMediaData();

  const { selectedImages, handleImageClick, clearSelectedImages } = useImageSelection();
  const { currentPath, navigateToFolder, navigateUp } = useFolderNavigation();
  const { isImageDragInProgress, handleActualImageDragStart, handleActualImageDragEnd } = useImageDragState();
  const { folderContextMenu, openFolderContextMenu, closeFolderContextMenu } = useFolderContextMenu();
  const { isFolderDragInProgress, handleFolderDragStart, handleFolderDragEnd } = useFolderDragState();


  const currentFolderData = getCurrentFolder(currentPath);
  const currentFolderImages = currentFolderData.images;
  const subFoldersInCurrentPath = Object.keys(currentFolderData.subFolders);


  
  // Add a new handler for folder creation
  const handleCreateFolder = async (folderPath: string) => {
    const success = await createFolder(folderPath);
      if (success) {
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
        // Update the current path if we're inside the renamed folder
        const oldFolderPath = folderToRename;
        const parentPath = oldFolderPath.split('/').slice(0, -1).join('/') || '';
        const newFolderPath = parentPath ? `${parentPath}/${newName}` : newName;
        
        // If current path starts with the old folder path, update it
        if (currentPath.startsWith(oldFolderPath)) {
          const remainingPath = currentPath.slice(oldFolderPath.length);
          const updatedPath = newFolderPath + remainingPath;
          navigateToFolder(updatedPath);
        }
        
        setShowRenameFolderModal(false);
        setFolderToRename(null);
      }
    }
  };

  const handleMoveFolderToTarget = async (source: string, target: string) => {
    const success = await moveFolder(source, target);
    if (success) {
      // If we're currently inside the moved folder, update navigation
      if (currentPath.startsWith(source)) {
        const remainingPath = currentPath.slice(source.length);
        const newPath = target ? `${target}/${source.split('/').pop()}${remainingPath}` : `${source.split('/').pop()}${remainingPath}`;
        navigateToFolder(newPath);
      }
    }
    return success;
  };

  const handleDeleteFolder = async (folderPath: string) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the folder "${folderPath.split('/').pop()}"? This action cannot be undone and will delete all contents including subfolders and images.`
    );
    
    if (!confirmDelete) return;
    
    closeFolderContextMenu();

    await deleteFolder(folderPath);
    
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


  if (loading) return <div className="flex justify-center p-8">Loading...</div>;
  
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
          onDeleteFolder={handleDeleteFolder}
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
        
        { error && <div className="text-red-500 p-8">{error}</div> }


        <FolderBrowser
          subFolders={subFoldersInCurrentPath}
          currentPath={currentPath}
          onFolderClick={navigateToFolder}
          onNavigateUp={navigateUp}
          onDropItemToFolder={moveImages}
          onDropFolderToFolder={handleMoveFolderToTarget}
          onContextMenuOpen={openFolderContextMenu}
          onFolderDragStart={handleFolderDragStart}
          onFolderDragEnd={handleFolderDragEnd}
          selectedItemCount={selectedImages.size}
          isGloballyDragging={isImageDragInProgress || isFolderDragInProgress}
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
