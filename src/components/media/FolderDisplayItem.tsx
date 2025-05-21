"use client";

import React from 'react';
import { FolderIcon } from '@heroicons/react/24/outline';
import { useDrop } from 'react-dnd';
import { ImageDragItem } from '@/types/mediaGalleryTypes';

interface FolderDisplayItemProps {
  name: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
  onDrop: (imageIds: string[]) => void;
  onContextMenuOpen: (event: React.MouseEvent, folderPath: string, folderName: string) => void;
  selectedItemCount: number;
  highlight?: boolean;
}

export const FolderDisplayItem: React.FC<FolderDisplayItemProps> = ({
  name,
  path,
  isActive,
  onClick,
  onDrop,
  onContextMenuOpen,
  selectedItemCount,
  highlight,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'IMAGE_COLLECTION',
    drop: (item: ImageDragItem) => {
      onDrop(item.imageIds);
      return { name };
    },
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [onDrop, name, path]);

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    console.log("Context menu triggered for:", { name, path });
    onContextMenuOpen(event, path, name);
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