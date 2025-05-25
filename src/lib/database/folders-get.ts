import { supabase } from './supabase-client';

export async function getFolders() {
  const { data: folders, error } = await supabase
    .from('folders')
    .select('id, name, parent_id')
    .order('name');
  
  

  if (error) {
    console.error("Error fetching folders:", error);
    throw new Error('Failed to fetch folders');
  }
  
  return folders;
}