import { supabase } from './supabase-client';

export async function renameFolder(folderPath: string, newName: string): Promise<void> {
  const pathParts = folderPath.split('/').filter(Boolean);
  const currentFolderName = pathParts[pathParts.length - 1];

  if (!currentFolderName) {
    throw new Error('Invalid folder path');
  }

  // Find parent folder
  let parentId: number | null = null;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const folderName = pathParts[i];

    const q =supabase
      .from('folders')
      .select('id')
      .eq('name', folderName)
      .eq('parent_id', parentId)
      .limit(1);

    const { data: folder, error } = await q.single()

    if (error || !folder) {
      throw new Error('Folder path not found');
    }

    parentId = folder.id;
  }

  // Find folder to rename
  let query = supabase
    .from('folders')
    .select('id')
    .eq('name', currentFolderName);

  if (parentId !== null) {
    query = query.eq('parent_id', parentId);
  } else {
    query = query.is('parent_id', null);
  }

  const { data: folderToRename, error: findError } = await query.limit(1).single();
  
  if (findError || !folderToRename) {
    throw new Error('Folder not found');
  }

  // Check if new name already exists
  const { data: existingFolder, error: existingError } = await supabase
    .from('folders')
    .select('id')
    .eq('name', newName)
    .eq('parent_id', parentId)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error('Error checking existing folders');
  }

  if (existingFolder) {
    throw new Error('A folder with this name already exists');
  }

  // Rename the folder
  const { error: updateError } = await supabase
    .from('folders')
    .update({ name: newName })
    .eq('id', folderToRename.id);

  if (updateError) {
    throw new Error('Error renaming folder');
  }
}