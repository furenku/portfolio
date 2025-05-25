import React, { useCallback, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { FolderIcon } from '@heroicons/react/24/outline';

interface FolderDisplayItemProps {
  name: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
  onDrop: (droppedImageIds: string[]) => void;
  onDropFolder: (source: string, target: string) => Promise<boolean>;
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
  // Add debug logging
  // console.log("FolderDisplayItem render:", { name, isGloballyDragging, isDraggable });
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, ImageCollectedProps>({
    accept: ['IMAGE', 'FOLDER' ],
    drop: (item) => {
      switch (item.type) {
        case 'IMAGE':
          console.log("🖼️ IMAGE DROP:", { item, folderPath: path });

          if ( item.imageIds) {
            onDrop(item.imageIds);
          }
          break;
          case 'FOLDER':
          console.log("🖼️ FOLDER DROP:", { item, path });
          onDropFolder((item as FolderDragItem).path, path);
          break;
      }
    },
    collect: (monitor) => {
      const result = {
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
  };
      // console.log("📥 Image drop collect:", result, "for folder:", name);
      return result;
    },
  });


  const [{ isDragging }, drag] = useDrag<FolderDragItem, void, FolderDragCollectedProps>({
    type: 'FOLDER',
    item: { type: 'FOLDER', path },
    canDrag: isDraggable,
    collect: (monitor) => {
      const result = { isDragging: monitor.isDragging() };
      if(monitor.isDragging()) console.log("📁 Folder drag collect:", result, "for folder:", name);
      return result;
    },
  });

  // const wasJustDragging = useRef(false);
  // Use useEffect to handle drag start/end events
  // useEffect(() => {
  //   if(isDragging) console.log("🇧🇩Folder dragging", isDragging);

  //   if (isDragging) {
  //     onFolderDragStart();
  //   } else {
  //     // Only call onFolderDragEnd if we were previously dragging
  //     // This prevents calling it on initial render
  //     if (wasJustDragging.current) {
  //     onFolderDragEnd();
  //     }
  //   }
  //   wasJustDragging.current = isDragging;
  // }, [isDragging, onFolderDragStart, onFolderDragEnd]);

  

  // Helper function to handle the async drop operation
  // const handleFolderDrop = async (sourcePath: string) => {
  //   try {
  //     const success = await onDropFolder(sourcePath);
  //     if (!success) {
  //       console.warn('Folder drop operation was not successful');
  //       // Handle unsuccessful drop (show notification, etc.)
  //     }
  //   } catch (error) {
  //     console.error('Error dropping folder:', error);
  //     // Handle error (show error notification, etc.)
  //   }
  // };

  // Combine refs for both image and folder drag/drop
  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    drag(node);
    drop(node);
  }, [drag, drop]);

  const handleClick = (e: React.MouseEvent) => {
    console.log("Folder clicked", e);
    
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
        group cursor-pointer border-2 border-dashed rounded-lg p-4 text-center transition-all
        ${isActive ? 'bg-blue-100 border-blue-300' : ''}
        ${isOver ? 'border-green-400 bg-green-50' : 'border-gray-300'}
        ${isOver && ! canDrop ? 'border-purple-400 bg-purple-50' : ''}
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
          {canDrop ? 'Release to drop' : 'Drag a box here'}

          Drop {selectedItemCount} item{selectedItemCount !== 1 ? 's' : ''} here
        </p>
      )}
    </div>
  );
};
