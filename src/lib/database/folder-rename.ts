import { supabase } from './supabase-client';

export async function renameFolder(folderPath: string, newName: string): Promise<void> {
  const pathParts = folderPath.split('/').filter(Boolean);
  const currentFolderName = pathParts.pop()

  if (!currentFolderName) {
    throw new Error('Invalid folder path');
  }

  // Find parent folder
  let parentId: number | null = null;
  for (let i = 0; i < pathParts.length; i++) {
    const folderName = pathParts[i];
    const q = supabase
      .from('folders')
      .select('id')
      .eq('name', folderName)
      .limit(1);
    
    if (parentId !== null) {      
      q.eq('parent_id', parentId)
    }

    const { data: folder, error } = await q.single()

    if (error || !folder) {
      throw new Error('Folder path not found');
    }

    parentId = folder.id;
  }

  // Find folder to rename
  let q = supabase
    .from('folders')
    .select('id')
    .eq('name', currentFolderName);

  if (parentId !== null) {
    q = q.eq('parent_id', parentId);
  } else {
    q = q.is('parent_id', null);
  }

  const { data: folderToRename, error: folderError } = await q.single();

  
  if (folderError || !folderToRename) {
    throw new Error('Folder to rename not found');
  }

  const q2 = supabase
    .from('folders')
    .update({ name: newName })
    .eq('id', folderToRename.id);

  const { error: updateError } = await q2;

  // Rename the folder

  if (updateError) {
    throw new Error('Error renaming folder');
  }
}