"use client";

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface RenameFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRenameFolder: (newName: string) => void;
  folderPath: string;
}

export const RenameFolderModal: React.FC<RenameFolderModalProps> = ({
  isOpen,
  onClose,
  onRenameFolder,
  folderPath,
}) => {
  const currentFolderName = folderPath.split('/').pop() || '';
  const [newFolderName, setNewFolderName] = useState(currentFolderName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewFolderName(currentFolderName);
      setError('');
    }
  }, [isOpen, currentFolderName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }
    
    if (newFolderName === currentFolderName) {
      onClose();
      return;
    }
    
    onRenameFolder(newFolderName);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md mx-auto">
          <Dialog.Title className="text-xl font-medium mb-4">
            Rename Folder
          </Dialog.Title>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Rename
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};