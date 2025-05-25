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



export async function GET() {
  await dbCheckPromise;
  
  if (!isDbStructureValid) {
    console.error("GET /api/images/folders: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {

    const { data: folders, error } = await supabase
      .from('folders')
      .select('id, name, parent_id')
      .order('name');
    
    if (error) {
      console.error("Error fetching folders:", error);
      return new NextResponse(JSON.stringify({ error: 'Failed to fetch folders' }), { status: 500 });
    }
    
    return new NextResponse(JSON.stringify(folders || []), { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/images/folders:", error);
    return new NextResponse(JSON.stringify({ error: 'Server error fetching folders' }), { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  await dbCheckPromise;

  if (!isDbStructureValid) {
      console.error("POST /api/images/folders: Aborting because database structure is invalid.");
      return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const { path } = await req.json();

    if (!path || typeof path !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Missing or invalid folder path' }), { status: 400 });
    }

    // Split path into parts to create folders hierarchically
    const pathParts = path.split('/').filter(Boolean);

    if (pathParts.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Invalid folder path' }), { status: 400 });
    }

    let parentId: number | null  = null;

    // Create folders hierarchically, ensuring parents exist
    for (const folderName of pathParts) {

      // Check if this folder segment already exists under the current parent
      const q = supabase
        .from('folders')
        .select('id, name')
        .eq('name', folderName)
        .limit(1);

      if (parentId !== null) {
        console.log("parentId", parentId);
        
        q.eq('parent_id', parentId);
      } else {
        console.log("parentId is null", folderName);
        q.is('parent_id', null);
      }

      const { data: existingFolder, error: lookupError }:  { 
        data: Folder | null, 
        error: Error | null
      } = await q.maybeSingle();

      if (lookupError) {
        console.error("Error checking folder existence:", lookupError);
        return new NextResponse(JSON.stringify({ error: 'Error checking folder existence' }), { status: 500 });
      }

      if (existingFolder) {
        // This folder segment already exists, use its ID for next iteration
        parentId = existingFolder.id;

        console.log("existingFolder", existingFolder);
        
        continue;
      }

      const body: {
        name: string,
        parent_id?: number
      } = {
        name: folderName
      }

      if( parentId ) {
        body.parent_id = parentId
      }

      // Create the folder segment since it doesn't exist
      const { data: newFolder, error: insertError }: {
        data: Folder | null,
        error: Error | null
      } = await supabase
        .from('folders')
        .insert(body)
        .select('id')
        .limit(1)
        .single();

        console.log("newFolder", newFolder)
        

      if (insertError || ! newFolder) {
        console.error("Error creating folder:", insertError);
        return new NextResponse(JSON.stringify({ error: 'Error creating folder' }), { status: 500 });
      }

      // Set this new folder as parent for next iteration
      parentId = newFolder ? newFolder.id : null;

    }

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Folder created successfully',
      path
    }), { status: 201 });

  } catch (error) {
    console.error("Error creating folder:", error);
    return new NextResponse(JSON.stringify({ error: 'Server error creating folder' }), { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await dbCheckPromise;

  if (!isDbStructureValid) {
    console.error("PATCH /api/images/folders: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const { folderPath, newName } = await req.json();

    if (!folderPath || !newName || typeof folderPath !== 'string' || typeof newName !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Missing or invalid folder path or name' }), { status: 400 });
    }

    // Get folder name from the path
    const pathParts = folderPath.split('/').filter(Boolean);
    const currentFolderName = pathParts[pathParts.length - 1];

    if (!currentFolderName) {
      return new NextResponse(JSON.stringify({ error: 'Invalid folder path' }), { status: 400 });
    }

    
    let parentId: number | null = null;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const folderName = pathParts[i];

      const { data: folder, error }: { data: { id: number } | null, error: any } = await supabase
        .from('folders')
        .select('id')
        .eq('name', folderName)
        .eq('parent_id', parentId)
        .limit(1)
        .single();

      if (error) {
        console.error("Error finding folder hierarchy:", error);
        return new NextResponse(JSON.stringify({ error: 'Error locating folder' }), { status: 500 });
      }

      if (!folder) {
        return new NextResponse(JSON.stringify({ error: 'Folder path not found' }), { status: 404 });
      }

      parentId = folder ? folder.id : null;
    }

    // Now find the actual folder to rename
    let query = supabase
      .from('folders')
      .select('id')
      .eq('name', currentFolderName);

    // Only add the parent_id condition if it's not null (for root folder case)
    if (parentId !== null) {
      query = query.eq('parent_id', parentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data: folderToRename, error: findError } = await query.limit(1).single();
    if (findError) {
      console.error("Error finding folder to rename:", findError);
      return new NextResponse(JSON.stringify({ error: 'Error locating folder to rename' }), { status: 500 });
    }

    if (!folderToRename) {
      return new NextResponse(JSON.stringify({ error: 'Folder not found' }), { status: 404 });
    }

    // Check if a folder with the new name already exists in the same parent
    const { data: existingFolder, error: existingError } = await supabase
      .from('folders')
      .select('id')
      .eq('name', newName)
      .limit(1)
      .maybeSingle();


    if (existingError) {
      console.error("Error checking existing folder:", existingError);
      return new NextResponse(JSON.stringify({ error: 'Error checking existing folders' }), { status: 500 });
    }

    if (existingFolder) {
      return new NextResponse(JSON.stringify({ error: 'A folder with this name already exists' }), { status: 409 });
    }

    // Rename the folder
    const { error: updateError } = await supabase
      .from('folders')
      .update({ name: newName })
      .eq('id', folderToRename.id);

    if (updateError) {
      console.error("Error renaming folder:", updateError);
      return new NextResponse(JSON.stringify({ error: 'Error renaming folder' }), { status: 500 });
    }

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Folder renamed successfully',
      oldPath: folderPath,
      newName
    }), { status: 200 });

  } catch (error) {
    console.error("Error renaming folder:", error);
    return new NextResponse(JSON.stringify({ error: 'Server error renaming folder' }), { status: 500 });
  }
}



export async function PUT(req: NextRequest) {
  await dbCheckPromise;

  if (!isDbStructureValid) {
    console.error("PUT /api/images/folders: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const { source, target } = await req.json();
 

    if (!source || typeof source !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Missing or invalid source folder path' }), { status: 400 });
    }

    if ( target !== null && typeof target !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Invalid target folder path' }), { status: 400 });
    }

    // Prevent moving a folder into itself or its descendants
    if (target && (target === source || target.startsWith(source+"/"))) {
      return new NextResponse(JSON.stringify({ error: 'Cannot move folder into itself or its descendants' }), { status: 400 });
    }

    const sourcePathParts = source.split('/').filter(Boolean);

    const sourceFolderName = sourcePathParts.pop()

    if (!sourceFolderName) {
      return new NextResponse(JSON.stringify({ error: 'Invalid source folder path' }), { status: 400 });
    }


    

    let sourceParentId: number | null = null;
    let targetFolderId: number | null = null;
    
    for (let i = 0; i < sourcePathParts.length - 1; i++) {
      const q = supabase
        .from('folders')
        .select('id, name')
        .eq('name', sourcePathParts[i])
        .limit(1)

      if(sourceParentId) {
        q.eq('parent_id', sourceParentId)        
      }
      
      const { data: folder, error } = await q.single();

      if (error) {
        return new NextResponse(JSON.stringify({ error: 'Error checking source folder path' }), { status: 404 });
      }
      console.log("folder", folder.name, folder.id);
      
      sourceParentId = folder ? folder.id : null;
    }

    const q = supabase
      .from('folders')
      .select('id, name')
      .eq('name', sourceFolderName)
      .limit(1)
      // if(sourceParentId) {
      //   q.eq('parent_id', sourceParentId)        
      // }

    const { data: sourceFolder, error: sourceFindError } = await q.single();

    

    if (sourceFindError || !sourceFolder) {
      return new NextResponse(JSON.stringify({ error: 'Source folder not found' }), { status: 404 });
    }
    console.log("folder", sourceFolder.name, sourceFolder.id);

      
    if( target ) {

      let targetParentId: number | null = null;

      const targetPathParts = target.split('/').filter(Boolean);

      
      
      for (const folderName of targetPathParts) {
        const q = supabase
          .from('folders')
          .select('id')
          .eq('name', folderName)
          .limit(1);

          if(targetParentId) {
            q.eq('parent_id', targetParentId)        
          }

          const { data: folder, error } = await q.single();

          
        if (error || !folder) {
          return new NextResponse(JSON.stringify({ error: 'Target folder path not found' }), { status: 404 });
        }

        targetParentId = folder ? folder.id : null;
        
        if( folderName === targetPathParts[targetPathParts.length - 1]) {
          targetFolderId = folder.id;
        }
      }

      if( ! targetFolderId ) {
        
        return new NextResponse(JSON.stringify({ error: 'Target folder not found' }), { status: 404 });
      }

      const q2 = supabase
      .from('folders')
      .select('id')
      .eq('name', sourceFolderName)
      .eq('parent_id', targetFolderId)
      .limit(1);

      const { data: existingFolder, error: existingError } = await q2.maybeSingle();

      if (existingError) {
        console.error("Error checking existing folder:", existingError);
        return new NextResponse(JSON.stringify({ error: 'Error checking target location' }), { status: 500 });
      }

      if (existingFolder) {
        return new NextResponse(JSON.stringify({ error: 'A folder with this name already exists in the target location' }), { status: 409 });
      }
      
    
    } else {
      targetFolderId = null;
    }

    // Update the folder's parent_id
    const { error: updateError } = await supabase
      .from('folders')
      .update({ parent_id: targetFolderId })
      .eq('id', sourceFolder.id);

    if (updateError) {
      console.error("Error moving folder:", updateError);
      return new NextResponse(JSON.stringify({ error: 'Error moving folder' }), { status: 500 });
    }

    // Update image paths for all images in the moved folder and its subfolders
    const newTargetPath = target ? `${target}/${sourceFolderName}` : sourceFolderName;
    
    const { error: imageUpdateError } = await supabase
      .from('images')
      .update({ 
        path: newTargetPath
      })
      .eq('path', source);

    // Update paths for images in subfolders
    const { error: subfolderImageUpdateError } = await supabase
      .from('images')
      .update({ 
        path: supabase.rpc('replace_path_prefix', {
          old_prefix: source + '/',
          new_prefix: newTargetPath + '/',
          current_path: 'path'
        })
      })
      .like('path', `${source}/%`);

    if (imageUpdateError || subfolderImageUpdateError) {
      console.error("Error updating image paths:", imageUpdateError || subfolderImageUpdateError);
      // Note: In a production environment, you might want to implement a transaction here
      // to rollback the folder move if image path updates fail
    }

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Folder moved successfully',
      source,
      target,
      newPath: newTargetPath
    }), { status: 200 });

  } catch (error) {
    console.error("Error moving folder:", error);
    return new NextResponse(JSON.stringify({ error: 'Server error moving folder' }), { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  await dbCheckPromise;

  if (!isDbStructureValid) {
    console.error("DELETE /api/images/folders: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const { folderPath } = await req.json();

    if (!folderPath || typeof folderPath !== 'string') {
      return new NextResponse(JSON.stringify({ error: 'Missing or invalid folder path' }), { status: 400 });
    }

    const pathParts = folderPath.split('/').filter(Boolean);
    if (pathParts.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Invalid folder path' }), { status: 400 });
    }

    // Find the folder to delete by traversing the path
    let parentId: number | null = null;
    let folderToDeleteId: number | null = null;

    for (let i = 0; i < pathParts.length; i++) {
      const folderName = pathParts[i];
      const isLastPart = i === pathParts.length - 1;

      const query = supabase
        .from('folders')
        .select('id, name')
        .eq('name', folderName)
        .limit(1);

      if (parentId !== null) {
        query.eq('parent_id', parentId);
      } else {
        query.is('parent_id', null);
      }

      const { data: folder, error } = await query.single();

      if (error || !folder) {
        return new NextResponse(JSON.stringify({ error: 'Folder not found' }), { status: 404 });
      }

      if (isLastPart) {
        folderToDeleteId = folder.id;
      } else {
        parentId = folder.id;
      }
    }

    if (!folderToDeleteId) {
      return new NextResponse(JSON.stringify({ error: 'Folder not found' }), { status: 404 });
    }

    // Get all descendant folder IDs (including the folder itself)
    const getAllDescendantIds = async (folderId: number): Promise<number[]> => {
      const ids = [folderId];
      
      const { data: children, error } = await supabase
        .from('folders')
        .select('id')
        .eq('parent_id', folderId);

      if (error) {
        throw new Error('Error finding child folders');
      }

      for (const child of children || []) {
        const descendantIds = await getAllDescendantIds(child.id);
        ids.push(...descendantIds);
      }

      return ids;
    };

    const allFolderIds = await getAllDescendantIds(folderToDeleteId);

    // Delete all images in these folders and their subfolders
    const { error: imageDeleteError } = await supabase
      .from('images')
      .delete()
      .or(
        allFolderIds.map(id => `folder_id.eq.${id}`).join(',')
      );

    // Also delete images that match the path pattern (fallback for path-based images)
    const { error: pathImageDeleteError } = await supabase
      .from('images')
      .delete()
      .or(`path.eq.${folderPath},path.like.${folderPath}/%`);

    if (imageDeleteError) {
      console.error("Error deleting images:", imageDeleteError);
      return new NextResponse(JSON.stringify({ error: 'Error deleting folder contents' }), { status: 500 });
    }

    // Delete all folders (children first, then parent)
    // Sort by depth (deepest first) to avoid foreign key constraints
    const sortedFolderIds = allFolderIds.reverse();
    
    for (const folderId of sortedFolderIds) {
      const { error: folderDeleteError } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (folderDeleteError) {
        console.error(`Error deleting folder ${folderId}:`, folderDeleteError);
        return new NextResponse(JSON.stringify({ error: 'Error deleting folder' }), { status: 500 });
      }
    }

    return new NextResponse(JSON.stringify({
      success: true,
      message: 'Folder and all contents deleted successfully',
      deletedPath: folderPath,
      deletedFolders: allFolderIds.length,
    }), { status: 200 });

  } catch (error) {
    console.error("Error deleting folder:", error);
    return new NextResponse(JSON.stringify({ error: 'Server error deleting folder' }), { status: 500 });
  }
}