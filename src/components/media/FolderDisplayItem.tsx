import React, { useCallback, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { FolderIcon } from '@heroicons/react/24/outline';

interface FolderDisplayItemProps {
  name: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
  onDrop: (droppedImageIds: string[]) => void;
  onDropFolder: (sourceFolderPath: string) => Promise<boolean>;
  onContextMenuOpen: (event: React.MouseEvent, folderPath: string, folderName: string) => void;
  onFolderDragStart: () => void;
  onFolderDragEnd: () => void;
  selectedItemCount: number;
  isGloballyDragging: boolean;
  isDraggable: boolean;
}

// Define types for drag and drop
interface DragItem {
  type: string;
  imageIds?: string[];
}

interface FolderDragItem {
  type: 'FOLDER';
  path: string;
}

interface ImageCollectedProps {
  isOver: boolean;
  canDrop: boolean;
}

interface FolderDragCollectedProps {
  isDragging: boolean;
}

interface FolderDropCollectedProps {
  isOverFolder: boolean;
  canDropFolder: boolean;

}

export const FolderDisplayItem: React.FC<FolderDisplayItemProps> = ({
  name,
  path,
  isActive,
  onClick,
  onDrop,
  onDropFolder,
  onContextMenuOpen,
  onFolderDragStart,
  onFolderDragEnd,
  selectedItemCount,
  isGloballyDragging,
  isDraggable,
}) => {
  // Existing image drag/drop logic
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, ImageCollectedProps>({
    accept: 'IMAGE',
    drop: (item) => {
      console.log("Dropped item:", item);
      if (item.imageIds) {
        
        onDrop(item.imageIds);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const [, drag] = useDrag({
    type: 'FOLDER_TARGET',
    item: { folderPath: path, selectedItemCount },
    collect: () => ({}),
  }, [onDrop, name, path]);

  // Folder drag/drop logic with proper typing and callbacks
  const [{ isDragging }, folderDrag] = useDrag<FolderDragItem, void, FolderDragCollectedProps>({
    type: 'FOLDER',
    item: { type: 'FOLDER', path },
    canDrag: isDraggable,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }, [path, isDraggable]);

  // Use useEffect to handle drag start/end events
  const wasJustDragging = useRef(false);
  useEffect(() => {

    console.log("Folder drag state changed:", isDragging);
    console.log(wasJustDragging);
    

    if (isDragging) {
      onFolderDragStart();
    } else {
      // Only call onFolderDragEnd if we were previously dragging
      // This prevents calling it on initial render
      if (wasJustDragging.current) {
      onFolderDragEnd();
      }
    }
    wasJustDragging.current = isDragging;
  }, [isDragging, onFolderDragStart, onFolderDragEnd]);


  const [{ isOverFolder, canDropFolder }, folderDrop] = useDrop<FolderDragItem, void, FolderDropCollectedProps>({
    accept: 'FOLDER',
    drop: (item) => {
      console.log("item", item);
      

      if (item.type === 'FOLDER' && item.path !== path) {
        // Fire and forget the async operation
        handleFolderDrop(item.path);
      }
    },
    collect: (monitor) => ({
      isOverFolder: monitor.isOver() && monitor.canDrop(),
      canDropFolder: monitor.canDrop(),
    }),
  });

  // Helper function to handle the async drop operation
  const handleFolderDrop = async (sourcePath: string) => {
    try {
      const success = await onDropFolder(sourcePath);
      if (!success) {
        console.warn('Folder drop operation was not successful');
        // Handle unsuccessful drop (show notification, etc.)
      }
    } catch (error) {
      console.error('Error dropping folder:', error);
      // Handle error (show error notification, etc.)
    }
  };

  // Combine refs for both image and folder drag/drop
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    drag(node);
    drop(node);
    folderDrag(node);
    folderDrop(node);
  }, [drag, drop, folderDrag, folderDrop]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenuOpen(e, path, name);
  };

  return (
    <div
      ref={combinedRef}
      className={`
        flex items-center p-2 my-1 rounded-md cursor-pointer transition
-        ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}
-        ${isOver && canDrop ? 'bg-blue-200 ring-2 ring-blue-500' : ''}
-        border border-dashed ${isOver && canDrop ? 'border-blue-500' : 'border-transparent'}
        group cursor-pointer border-2 border-dashed rounded-lg p-4 text-center transition-all
        ${isActive ? 'bg-blue-100 border-blue-300' : ''}
        ${isOver ? 'border-green-400 bg-green-50' : 'border-gray-300'}
        ${isOverFolder ? 'border-purple-400 bg-purple-50' : ''}
        ${isDragging ? 'opacity-100' : ''}
        ${isDragging && isOver && canDrop ? 'hover:border-gray-400 opacity-100' : ''}
        ${isGloballyDragging && !isDragging ? 'opacity-50' : ''}
         hover:bg-gray-50
      `}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <FolderIcon className="w-5 h-5 mr-2 text-blue-500" />      
      <p className="text-sm font-medium truncate">{name}</p>
      {selectedItemCount > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          Drop {selectedItemCount} item{selectedItemCount !== 1 ? 's' : ''} here
        </p>
      )}
    </div>
  );
};