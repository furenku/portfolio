import { supabase } from './supabase-client';

export async function moveFolder(source: string, target: string | null): Promise<string> {
  const sourcePathParts = source.split('/').filter(Boolean);
  const sourceFolderName = sourcePathParts.pop();

  if (!sourceFolderName) {
    throw new Error('Invalid source folder path');
  }

  // Find source folder
  let sourceParentId: number | null = null;
  for (const folderName of sourcePathParts) {
    const q = supabase
      .from('folders')
      .select('id')
      .eq('name', folderName)      
      .limit(1);

    if (sourceParentId !== null) {
    q.eq('parent_id', sourceParentId);
    } else {
    q.is('parent_id', null);
    }

    const { data: folder, error } = await q.single()

    if (error || !folder) {
      throw new Error('Source folder path not found');
    }

    sourceParentId = folder.id;
  }

  // Find the actual folder to move
  let sourceFolderQuery = supabase
    .from('folders')
    .select('id')
    .eq('name', sourceFolderName);

  if (sourceParentId !== null) {
    sourceFolderQuery = sourceFolderQuery.eq('parent_id', sourceParentId);
  } else {
    sourceFolderQuery = sourceFolderQuery.is('parent_id', null);
  }

  const { data: sourceFolder, error: sourceFindError } = await sourceFolderQuery.limit(1).single();
  
  if (sourceFindError || !sourceFolder) {
    throw new Error('Source folder not found');
  }

  // Find target parent folder
  let targetParentId: number | null = null;
  if (target) {
    const targetPathParts = target.split('/').filter(Boolean);
    for (const folderName of targetPathParts) {
      const q = supabase
        .from('folders')
        .select('id')
        .eq('name', folderName)
        .limit(1);

    if(targetParentId !== null) {
      q.eq('parent_id', targetParentId);
    } else {
      q.is('parent_id', null);
    }
    const { data: folder, error } = await q.single();

      if (error || !folder) {        

        throw new Error('Target folder path not found');
      }

      targetParentId = folder.id;
    }
  }

  // Check if a folder with the same name already exists in target location
  let conflictQuery = supabase
    .from('folders')
    .select('id')
    .eq('name', sourceFolderName);

  if (targetParentId !== null) {
    conflictQuery = conflictQuery.eq('parent_id', targetParentId);
  } else {
    conflictQuery = conflictQuery.is('parent_id', null);
  }

  const { data: existingFolder, error: conflictError } = await conflictQuery.limit(1).maybeSingle();

  if (conflictError) {
    throw new Error('Error checking for naming conflicts');
  }

  if (existingFolder && existingFolder.id !== sourceFolder.id) {
    throw new Error('A folder with this name already exists in the target location');
  }

  // Move the folder
  const updateData: { parent_id: number | null } = { parent_id: targetParentId };

  const { error: moveError } = await supabase
    .from('folders')
    .update(updateData)
    .eq('id', sourceFolder.id);

  if (moveError) {
    throw new Error('Error moving folder');
  }

  // Return new path
  const newPath = target ? `${target}/${sourceFolderName}` : sourceFolderName;
  return newPath;
}