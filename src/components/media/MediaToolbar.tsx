"use client";

import React from 'react';
import { Squares2X2Icon, ListBulletIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ViewMode } from '@/types/mediaGalleryTypes';

interface MediaToolbarProps {
  currentPath: string;
  onNavigateUp: () => void;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  onShowCreateFolderModal: () => void;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({
  currentPath,
  onNavigateUp,
  viewMode,
  onSetViewMode,
  onShowCreateFolderModal,
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        {currentPath && (
          <div className="flex items-center ml-4">
            <button
              onClick={onNavigateUp}
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
          onClick={() => onSetViewMode('grid')} 
          className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          aria-label="Grid view"
        >
          <Squares2X2Icon className="w-5 h-5" />
        </button>
        <button 
          onClick={() => onSetViewMode('list')} 
          className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`} 
          aria-label="List view"
        >
          <ListBulletIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={onShowCreateFolderModal} 
          className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <PlusIcon className="w-4 h-4 mr-1" /> New Folder
        </button>
      </div>
    </div>
  );
};