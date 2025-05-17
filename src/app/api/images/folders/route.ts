import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';



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
    const data = await req.json();
    console.log("POST /api/images/folders: Form data parsed successfully.", data);
    
  } catch (error) {
    console.error("POST /api/images/folders: Error parsing form data:", (error as Error).message);
    return new NextResponse(JSON.stringify({ error: 'Error parsing form data. Please ensure the request is a valid multipart/form-data.' }), { status: 400 });
  }

  return new NextResponse(JSON.stringify({ error: 'Implementation pending. This endpoint is not yet available.' }), { status: 501 });


}
