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

    return new NextResponse(JSON.stringify({ error: 'Impementation pending.' }), { status: 500 });

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
    let currentPath = '';

    // Create folders hierarchically, ensuring parents exist
    for (const folderName of pathParts) {
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      console.log("folderName", folderName);
      console.log("parentId", parentId);
      

      // Check if this folder segment already exists under the current parent
      const { data: existingFolder, error: lookupError }:  { 
        data: Folder | null, 
        error: Error | null
      } = await supabase
        .from('folders')
        .select('id, name, parent_id')
        .eq('name', folderName)
        .limit(1)
        .maybeSingle();

      if (lookupError) {
        console.error("Error checking folder existence:", lookupError);
        return new NextResponse(JSON.stringify({ error: 'Error checking folder existence' }), { status: 500 });
      }

      if (existingFolder) {
        // This folder segment already exists, use its ID for next iteration
        parentId = existingFolder.id;
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

      if (insertError) {
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
