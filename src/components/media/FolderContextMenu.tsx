"use client";

import React from 'react';

interface FolderContextMenuProps {
  x: number;
  y: number;
  folderName: string;
  folderPath: string;
  itemCount: number;
  onMoveSelectedItems: () => void;
  onRenameFolder: (folderPath: string) => void;
}

export const FolderContextMenu: React.FC<FolderContextMenuProps> = ({
  x,
  y,
  folderName,
  folderPath,
  itemCount,
  onMoveSelectedItems,
  onRenameFolder,
}) => {
  console.log("Rendering FolderContextMenu:", { x, y, folderName, folderPath, itemCount });

  return (
    <div
      style={{ top: y, left: x, position: 'fixed', zIndex: 150 }}
      className="bg-white shadow-lg rounded-md py-1 border border-gray-200 min-w-[200px]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => onRenameFolder(folderPath)}
        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
      >
        Rename "{folderName}"
      </button>
      
      {itemCount > 0 && (
        <button
          onClick={onMoveSelectedItems}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          Move {itemCount} item(s) to "{folderName}"
        </button>
      )}
    </div>
  );
};