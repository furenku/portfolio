"use client";

import React from 'react';

interface FolderContextMenuProps {
  x: number;
  y: number;
  folderName: string;
  itemCount: number;
  onMoveSelectedItems: () => void;
}

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  x,
  y,
  folderName,
  itemCount,
  onMoveSelectedItems,
}) => {
  return (
    <div
      style={{ top: y, left: x, position: 'fixed', zIndex: 150 }}
      className="bg-white shadow-lg rounded-md py-1 border border-gray-200 min-w-[200px]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onMoveSelectedItems}
        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      >
        Move {itemCount} item(s) to "{folderName}"
      </button>
    </div>
  );
};