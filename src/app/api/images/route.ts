import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApiImage, Breakpoint, Dimensions, ImageSize } from '@/types/media-server';




type SizeRecords = {
  [ key in Breakpoint ]?: ImageSize
}


interface ActionResult {
  ok: boolean;
  status: number;
}

// import images from "../../../../data/test/images/get.json"


const uploadOriginal = async (file: File) : Promise<ActionResult & { data?: Dimensions }> => {
  try {
  
    const data = new FormData();
    data.append('file', file, file.name);
    
    const uploadWorkerUrl = process.env.CF_UPLOAD_WORKER_URL;

    if (!uploadWorkerUrl) {
      console.error('CF_UPLOAD_WORKER_URL is not defined');
      return {
        ok: false,
        status: 500,
      };
    }

    const uploadWorkerResponse = await fetch(uploadWorkerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPLOAD_WORKER_TOKEN}`,
      },
      body: data,        
    });

    // Check if the worker responded successfully
    if (!uploadWorkerResponse.ok) {
      const errorText = await uploadWorkerResponse.text();
      console.error(`Worker error: ${uploadWorkerResponse.status} ${uploadWorkerResponse.statusText}`, errorText);
      return {
        ok: false,
        status: uploadWorkerResponse.status,
      };
    }

    const uploadWorkerData = await uploadWorkerResponse.json();
    

    return {
      ok: true,
      data: uploadWorkerData,
      status: uploadWorkerResponse.status,
    };

  } catch (error) {
    console.error('Error in POST /api/images:', error);
    return {
      ok: false,
      status: 500,
    };
  }
}

const uploadResult = async ( name: string, result: Blob, size: keyof SizeRecords ) : Promise<ActionResult & { data?: Dimensions }> => {          
  try {


    const data = new FormData();
    data.append('file', result, name);
    data.append('size', size );
    

    const uploadWorkerUrl = process.env.CF_UPLOAD_WORKER_URL;

    if (!uploadWorkerUrl) {
      console.error('CF_UPLOAD_WORKER_URL is not defined');
      return {
        ok: false,
        status: 500,
      };
    }

    const uploadWorkerResponse = await fetch(uploadWorkerUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPLOAD_WORKER_TOKEN}`,
      },
      body: data,        
    });

    if (!uploadWorkerResponse.ok) {
      const errorText = await uploadWorkerResponse.text();
      console.error(`Worker error: ${uploadWorkerResponse.status} ${uploadWorkerResponse.statusText}`, errorText);
      return {
        ok: false,
        status: uploadWorkerResponse.status,
      };
    }

    const uploadWorkerData = await uploadWorkerResponse.json();

    
    
    
    return {
      ok: true,
      data: uploadWorkerData,
      status: uploadWorkerResponse.status,
    };
    


  } catch (error) {

  console.error('Error in uploading resized image:', (error as Error).message);

  return {
    ok: false,
    status: 500,
  };
}
}

const createResized = async (name:string, src:string, size?: Breakpoint) : Promise<ActionResult & { data?: ImageSize, sizes?: SizeRecords }> => {
  
  const storageUrl = process.env.CF_STORAGE_WORKER_URL;

  const sizes : SizeRecords = {}
  
  try {

    const sizesList: (keyof typeof sizes)[]  = size ? [size] : ['xs', 'sm', 'md', 'lg', 'xl'];
    
    for (const size of sizesList) {

      const data = new FormData();
      
      data.append('size', size);
      data.append('url', src);

      const imageWorkerUrl = process.env.CF_IMAGE_WORKER_URL;

      if (!imageWorkerUrl) {
        console.error('CF_UPLOAD_WORKER_URL is not defined');
        return {
          ok: false,
          status: 500,
        };
      }

      const resizeWorkerResponse = await fetch( imageWorkerUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESIZE_WORKER_TOKEN}`,
        },
        body: data
      });

      
      if( ! resizeWorkerResponse.ok ) {
        const errorText = await resizeWorkerResponse.text();
        console.error(`Worker error: ${resizeWorkerResponse.status} ${resizeWorkerResponse.statusText}`, errorText);

        return NextResponse.json(
          {
            error: 'Failed to resize image',
            workerStatus: resizeWorkerResponse.status,
            resizeWorkerResponse: errorText, // Include worker response for debugging
          },
          { status: resizeWorkerResponse.status } // Forward the worker's status code
        );
      }

      const result = await resizeWorkerResponse.blob()
      

      const didUpload = await uploadResult( name, result, size )

      if( ! didUpload.ok ) {
        return didUpload as ActionResult
      }
      
      
      if( ! didUpload.data?.width || ! didUpload.data?.height ) {
        console.error('Failed to get image dimensions');
        return {
          ok: false,
          status: 500,
        };
      }

      sizes[size as keyof typeof sizes] = {
        src: storageUrl + '/resized/' + size + '/' + name,
        width: didUpload.data.width,
        height: didUpload.data.height,
      }
      
    }
    
    const result: (
      ActionResult & { data?: ImageSize, sizes?: SizeRecords }
    ) = {
      ok: true,
      status: 200
    }

    if( ! size ) {
      result.sizes = sizes      
    } else  {
      result.data = sizes[size]
    }

    return result
    
  } catch (error) {
    
    console.error('Error in reupload:', error);
    
    return {
      ok: false,
      status: 500
    };

  }

}



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
        console.error("Required columns: id, created_at, filename, src, sizes (jsonb), alt_text, caption");
      } else {
        console.error(`FATAL: Error querying table "${tableName}". Check permissions or connection.`, existError);
      }
      throw new Error(`Database table "${tableName}" verification failed.`); // Throw to stop initialization
    }

    // 2. Check for essential columns (add more as needed)
    // This query will fail if any of these columns don't exist.
    const { error: columnError } = await supabase
      .from(tableName)
      .select('id, filename, src, sizes, created_at, alt_text, caption')
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
    console.error("Database verification process encountered an error:", error);
    // Keep isDbStructureValid as false
    // Depending on your framework/setup, you might want to explicitly prevent handlers
    // from running, e.g., by not exporting them or having them check the flag.
    // For now, the console errors indicate the critical failure.
    isDbStructureValid = false;
    return false;
  }
})(); // Execute the check immediately

await dbCheckPromise;

// --- API Handlers ---

export async function GET() {
  
  await dbCheckPromise;
  
  if (!isDbStructureValid) {
       console.error("GET /api/images: Aborting because database structure is invalid.");
       return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {

    // return new NextResponse(JSON.stringify(images), { status: 200 });

    // Fetch images from Supabase 'images' table
    const { data: imagesData, error } = await supabase
      .from('images') // Replace 'images' with your actual table name
      .select('*') // Select all columns
      .order('created_at', { ascending: false }); // Optional: order by creation date

    if (error) {
      console.error('Supabase GET error:', error);
      throw error; // Let the catch block handle it
    }

    const formattedImages: ApiImage[] = imagesData?.map(img => ({
      id: img.id,
      
      src: img.src, 
      alt: img.alt_text,     
      caption: img.caption,      
      sizes: img.sizes,        
      preview: img.preview,  
      filename: img.filename,    
      created_at: img.created_at,
      width: img.width,
      height: img.height
    })) || []; 


    // Return the fetched and formatted data
    return new NextResponse(JSON.stringify(formattedImages), {
       status: 200,
       headers: { 'Content-Type': 'application/json' } // Set content type
    });

    

  } catch (error) {
    console.error('Error fetching images from Supabase:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch images', details: message }), { status: 500 });
  }

}



export async function POST(req: NextRequest) {
  
  if (!isDbStructureValid) {
    console.error("POST /api/images: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  const storageUrl = process.env.CF_STORAGE_WORKER_URL;
  

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
       return NextResponse.json(
         { error: 'Invalid content type, expected multipart/form-data' },
         { status: 415 } // Unsupported Media Type
       );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    // Optional: Get alt text and caption if sent from the client
    const altText = formData.get('alt') as string | null;
    const caption = formData.get('caption') as string | null;


    if (!file) {
      return NextResponse.json(
        { error: 'No file found in the request' },
        { status: 400 }
      );
    }

    // --- Upload Original ---
    const didUpload = await uploadOriginal( file )

    if( ! didUpload.ok ) {
      return NextResponse.json(
        { error: 'Could not upload original image' },
        { status: didUpload.status }
      );
    }


    if( ! didUpload.data?.width || ! didUpload.data?.height ) {
      return NextResponse.json(
        { error: 'Could not get image dimensions' },
        { status: didUpload.status }
      );
    }

    const originalUrl = storageUrl + '/original/' + file.name;

    // --- Create Resized Versions ---
    const response = await createResized( file.name, originalUrl )

    if( ! response.ok || !response.sizes ) { // Check response.sizes exists
      return NextResponse.json(
        { error: 'Could not create resized images' },
        { status: response.status }
      );
    }




    // --- Create Resized Versions ---
    const previewResponse = await createResized( file.name, originalUrl, 'preview' )

    if( ! previewResponse.ok || !response.sizes ) { // Check response.sizes exists
      return NextResponse.json(
        { error: 'Could not create preview' },
        { status: previewResponse.status }
      );
    }

    if( ! previewResponse.data ) {
      return NextResponse.json(
        { error: 'Could not get preview url' },
        { status: previewResponse.status }
      );
    }

    const previewData : ImageSize = await previewResponse.data


    
    const imageResponse = await fetch(previewData.src);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const previewContentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const preview: string = `data:${previewContentType};base64,${base64}`;



    // --- Store metadata in Supabase ---
    const { data: dbData, error: dbError } = await supabase
      .from('images') // Use your actual table name
      .insert([
        {
          filename: file.name,
          src: originalUrl,
          sizes: response.sizes, 
          alt_text: altText,     
          caption: caption,      
          preview,      
          width: didUpload.data.width, 
          height: didUpload.data.height, 
        },
      ])
      .select() // Optionally select the inserted data to return it
      .single(); // Expecting a single row insert


    if (dbError) {
      console.error('Supabase POST error:', dbError);
      // Consider what to do if DB insert fails after successful uploads
      // For now, return an error
      return NextResponse.json(
        { error: 'Failed to save image metadata to database', details: dbError.message },
        { status: 500 }
      );
    }

    // --- Respond ---
    // Optionally format the response using the data returned from Supabase (dbData)
    const newImageEntry: ApiImage = {
        id: dbData.id,
        src: dbData.src,
        alt: dbData.alt_text,
        caption: dbData.caption,
        sizes: dbData.sizes,
        preview: dbData.preview,
        filename: dbData.filename,
        created_at: dbData.created_at,
        width: dbData.width,
        height: dbData.height,
    };

    return NextResponse.json( newImageEntry, { status: 201 });


  } catch (error) {
     // ... (existing error handling) ...
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in POST /api/images:', message);
    // Distinguish between client errors (e.g., bad form data) and server errors
    if (error instanceof TypeError && error.message.includes('Could not parse content as FormData')) {
       return NextResponse.json(
           { error: 'Bad request: Invalid form data' },
           { status: 400 }
       );
    }
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}