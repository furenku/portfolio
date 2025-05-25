import { supabase } from './supabase-client';
import { Folder } from '@/types/media-server';

export async function createFolderHierarchy(pathParts: string[]): Promise<void> {
  let parentId: number | null = null;

  for (const folderName of pathParts) {
    // Check if folder already exists
    const q = supabase
      .from('folders')
      .select('id, name')
      .eq('name', folderName)
      .limit(1);

    if (parentId !== null) {
      q.eq('parent_id', parentId);
    } else {
      q.is('parent_id', null);
    }

    const { data: existingFolder, error: lookupError }: { 
      data: Folder | null, 
      error: Error | null
    } = await q.maybeSingle();

    if (lookupError) {
      console.error("Error checking folder existence:", lookupError);
      throw new Error('Error checking folder existence');
    }

    if (existingFolder) {
      parentId = existingFolder.id;
      continue;
    }

    // Create new folder
    const body: {
      name: string,
      parent_id?: number
    } = { name: folderName };

    if (parentId) {
      body.parent_id = parentId;
    }

    const { data: newFolder, error: insertError }: {
      data: Folder | null,
      error: Error | null
    } = await supabase
      .from('folders')
      .insert(body)
      .select('id')
      .limit(1)
      .single();


    if (insertError || !newFolder) {
      console.error("Error creating folder:", insertError);
      throw new Error('Error creating folder');
    }

    parentId = newFolder.id;
  }
}