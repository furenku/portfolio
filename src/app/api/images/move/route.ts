import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Folder } from '@/types/media-server';

const supabaseUrl = process.env.MEDIASERVER_SUPABASE_URL;
const supabaseAnonKey = process.env.MEDIASERVER_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables (URL and Anon Key) are not set.");
  throw new Error("Supabase environment variables are missing.");
}

// Create a single Supabase client instance
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// --- Database Structure Verification ---
// Use an immediately-invoked async function expression (IIAFE) to run the check
// Store the promise to ensure handlers wait for it if needed, or handle errors directly.
let isDbStructureValid = false; // Flag to track validity
const dbCheckPromise = (async () => {

  const tableName = 'images';
  const reqFields = ['id', 'path'];

  try {
    // 1. Check basic table existence and select permission with a minimal query
    const { error: existError } = await supabase
      .from(tableName)
      .select('id') // Select a known essential column
      .limit(0);

    if (existError) {
      // Check for specific "relation does not exist" error (Postgres code)
      if (existError.code === '42P01') {
        console.error(`FATAL: Table "${tableName}" does not exist. Please create it in Supabase.`);
        console.error("Fields Required columns: "+ reqFields.join(", "));
      } else {
        console.error(`FATAL: Error querying table "${tableName}". Check permissions or connection.`, existError);
      }
      throw new Error(`Database table "${tableName}" verification failed.`); // Throw to stop initialization
    }

    // 2. Check for essential columns (add more as needed)
    // This query will fail if any of these columns don't exist.
    const { error: columnError } = await supabase
      .from(tableName)
      .select(reqFields.join(', '))
      .limit(0);

    if (columnError) {
        // Check for specific "column does not exist" error (Postgres code)
       if (columnError.code === '42703') {
           console.error(`FATAL: Table "${tableName}" exists but has an incorrect structure. Missing or mismatched essential columns.`);
           console.error(`Details: ${columnError.message}`);
           console.error("Ensure columns exist: id, filename, src, sizes (jsonb), created_at, alt_text, caption");
       } else {
           console.error(`FATAL: Error selecting essential columns from "${tableName}".`, columnError);
       }
      throw new Error(`Database table "${tableName}" structure verification failed.`); // Throw to stop initialization
    }

    
    isDbStructureValid = true; // Set flag on success
    return true;

  } catch (error) {
    console.error("Database verification process encountered an error:", (error as Error).message);
    // Keep isDbStructureValid as false
    // Depending on your framework/setup, you might want to explicitly prevent handlers
    // from running, e.g., by not exporting them or having them check the flag.
    // For now, the console errors indicate the critical failure.
    isDbStructureValid = false;
    return false;
  }
})(); // Execute the check immediately

// Helper function to get or create a folder by path
async function getFolderIdByPath(path: string): Promise<number | null> {
  if (!path) return null; // Root folder (null parent)
  
  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length === 0) return null;
  
  let parentId: number | null = null;
  
  // Navigate through folder hierarchy
  for (const folderName of pathParts) {
    // Look for existing folder
    const { data: existingFolder, error: lookupError } : {
      data: Folder | null,
      error: Error | null 
    } = await supabase
      .from('folders')
      .select('id')
      .eq('name', folderName)
      .maybeSingle();
    
    if (lookupError) {
      console.error(`Error looking up folder "${folderName}":`, lookupError);
      throw new Error('Error looking up folder');
    }
    
    if (existingFolder) {
      parentId = existingFolder ? existingFolder.id : null;
      continue;
    }
    
    // Create folder if it doesn't exist
    const { data: newFolder, error: insertError } = await supabase
      .from('folders')
      .insert({
        name: folderName,
        parent_id: parentId
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error(`Error creating folder "${folderName}":`, insertError);
      throw new Error('Error creating folder');
    }
    
    parentId = newFolder.id;
  }
  
  return parentId;
}



export async function POST(req: NextRequest) {
  await dbCheckPromise;

  if (!isDbStructureValid) {
    console.error("POST /api/images/move: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const { imageIds, targetPath } = await req.json();
    
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Missing or invalid image IDs' }), { status: 400 });
    }
    
    // 1. Get or create the target folder ID
    let folderId: number | null;
    try {
      folderId = await getFolderIdByPath(targetPath);
    } catch (error) {
      console.error("Error resolving folder path:", error);
      return new NextResponse(JSON.stringify({ error: 'Error resolving folder path' }), { status: 500 });
    }
    
    // 2. Process each image
    const results = [];
    for (const imageId of imageIds) {
      // If target folder is null (root), we need to remove from imageFolders
      if (folderId === null) {
        // Remove image from all folders
        const { error: removeError } = await supabase
          .from('imageFolders')
          .delete()
          .eq('image_id', imageId);
        
        if (removeError) {
          console.error(`Error removing image ${imageId} from folders:`, removeError);
          results.push({ imageId, success: false, error: 'Failed to remove from folders' });
          continue;
        }
        
        // Update the path in the images table to reflect no folder
        const { error: updateError } = await supabase
          .from('images')
          .update({ path: '' })
          .eq('id', imageId);
        
        if (updateError) {
          console.error(`Error updating path for image ${imageId}:`, updateError);
          results.push({ imageId, success: false, error: 'Failed to update path' });
          continue;
        }
        
        results.push({ imageId, success: true, path: '' });
      } else {
        // Check if the image is already in this folder to avoid duplicates
        const { data: existing, error: checkError } = await supabase
          .from('imageFolders')
          .select('id')
          .eq('image_id', imageId)
          .eq('folder_id', folderId)
          .maybeSingle();
        
        if (checkError) {
          console.error(`Error checking existing folder assignment for image ${imageId}:`, checkError);
          results.push({ imageId, success: false, error: 'Failed to check existing folder' });
          continue;
        }
        
        if (!existing) {
          // Image is not in this folder, add it
          const { error: insertError } = await supabase
            .from('imageFolders')
            .insert({
              image_id: imageId,
              folder_id: folderId
            });
          
          if (insertError) {
            console.error(`Error adding image ${imageId} to folder:`, insertError);
            results.push({ imageId, success: false, error: 'Failed to add to folder' });
            continue;
          }
        }
        
        // Update the path in images table for UI compatibility
        const { error: updateError } = await supabase
          .from('images')
          .update({ path: targetPath })
          .eq('id', imageId);
        
        if (updateError) {
          console.error(`Error updating path for image ${imageId}:`, updateError);
          results.push({ imageId, success: false, error: 'Failed to update path' });
          continue;
        }
        
        results.push({ imageId, success: true, path: targetPath });
      }
    }
    
    return new NextResponse(JSON.stringify({ 
      success: true,
      message: `Moved ${results.filter(r => r.success).length} of ${imageIds.length} images`,
      results
    }), { status: 200 });
    
  } catch (error) {
    console.error("Error moving images:", error);
    return new NextResponse(JSON.stringify({ error: 'Server error moving images' }), { status: 500 });
  }
}
