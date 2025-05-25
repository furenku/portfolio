import { supabase } from './supabase-client';

interface DeleteResult {
  deletedFolders: number;
}

export async function deleteFolder(folderPath: string): Promise<DeleteResult> {
  const pathParts = folderPath.split('/').filter(Boolean);
  const folderName = pathParts.pop();

  if (!folderName) {
    throw new Error('Invalid folder path');
  }

  // Find parent folder
  let parentId: number | null = null;
  for (const part of pathParts) {
    const q =supabase
      .from('folders')
      .select('id')
      .eq('name', part)
      .limit(1);

    const { data: folder, error } = await q.single()

    if (error || !folder) {
      throw new Error('Folder path not found');
    }

    parentId = folder.id;
  }

  // Find the folder to delete
  let folderQuery = supabase
    .from('folders')
    .select('id')
    .eq('name', folderName);

  if (parentId !== null) {
    folderQuery = folderQuery.eq('parent_id', parentId);
  } else {
    folderQuery = folderQuery.is('parent_id', null);
  }

  const { data: folderToDelete, error: findError } = await folderQuery.limit(1).single();
  
  if (findError || !folderToDelete) {
    throw new Error('Folder not found');
  }

  // Recursively delete all subfolders and their contents
  const deletedFolders = await deleteRecursively(folderToDelete.id);

  return { deletedFolders };
}

async function deleteRecursively(folderId: number): Promise<number> {
  // Get all child folders
  const { data: childFolders, error: childError } = await supabase
    .from('folders')
    .select('id')
    .eq('parent_id', folderId);

  if (childError) {
    throw new Error('Error fetching child folders');
  }

  let totalDeleted = 0;

  // Recursively delete child folders
  for (const child of childFolders || []) {
    totalDeleted += await deleteRecursively(child.id);
  }

  // Delete all images in this folder
  const { error: imagesDeleteError } = await supabase
    .from('images')
    .delete()
    .eq('folder_id', folderId);

  if (imagesDeleteError) {
    throw new Error('Error deleting images in folder');
  }

  // Delete the folder itself
  const { error: folderDeleteError } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId);

  if (folderDeleteError) {
    throw new Error('Error deleting folder');
  }

  return totalDeleted + 1;
}