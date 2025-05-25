"use client";

import React from 'react';
import { FolderDisplayItem } from './FolderDisplayItem';

interface FolderBrowserProps {
  subFolders: string[];
  currentPath: string;
  onFolderClick: (folderName: string) => void;
  onNavigateUp: () => void;
  onDropItemToFolder: (imageIds: string[], targetPath: string) => void;
  onDropFolderToFolder: (source: string, targetFolderPath: string) => Promise<boolean>;
  onContextMenuOpen: (event: React.MouseEvent, folderPath: string, folderName: string) => void;
  onFolderDragStart: () => void;
  onFolderDragEnd: () => void;
  selectedItemCount: number;
  isGloballyDragging: boolean;
}

export const FolderBrowser: React.FC<FolderBrowserProps> = ({
  subFolders,
  currentPath,
  onFolderClick,
  onNavigateUp,
  onDropItemToFolder,
  onDropFolderToFolder,
  onContextMenuOpen,
  onFolderDragStart,
  onFolderDragEnd,
  selectedItemCount,
  isGloballyDragging,
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">Folders</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {/* Show parent in all subfolders */}
        {currentPath && (
          <FolderDisplayItem
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
            onClick={onNavigateUp}
            onDrop={(droppedImageIds) =>
              onDropItemToFolder(
                droppedImageIds,
                currentPath
                  .split('/')
                  .filter(Boolean)
                  .slice(0, -1)
                  .join('/')
              )
            }
            onDropFolder={(source) => 
              onDropFolderToFolder(
                source,
                currentPath
                  .split('/')
                  .filter(Boolean)
                  .slice(0, -1)
                  .join('/')
              )
            }
            onContextMenuOpen={onContextMenuOpen}
            onFolderDragStart={onFolderDragStart}
            onFolderDragEnd={onFolderDragEnd}
            selectedItemCount={selectedItemCount}
            isGloballyDragging={isGloballyDragging}
            isDraggable={false} // Parent folder shouldn't be draggable
          />
        )}
        {/* Root or subfolders */}
        {subFolders.map(folderName => {
          const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
          return (
            <FolderDisplayItem
              key={folderPath}
              name={folderName}
              path={folderPath}
              isActive={false}
              onClick={() => onFolderClick(folderName)}
              onDrop={(droppedImageIds) => onDropItemToFolder(droppedImageIds, folderPath)}
              onDropFolder={(source) => onDropFolderToFolder(source, folderPath)}
              onContextMenuOpen={onContextMenuOpen}
              onFolderDragStart={onFolderDragStart}
              onFolderDragEnd={onFolderDragEnd}
              selectedItemCount={selectedItemCount}
              isGloballyDragging={isGloballyDragging}
              isDraggable={true} // Regular folders are draggable
            />
          );
        })}
      </div>
    </div>
  );
};