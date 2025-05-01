import { NextRequest, NextResponse } from 'next/server';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ApiImage {
  src?: string;
  alt?: string;
  caption?: string;
  sizes: {
    [key in Breakpoint]: string;
  },
  preview?: string;

}


import images from "../../../../data/test/images/get.json"

export async function GET() {
  try {
    
    return new NextResponse(JSON.stringify(images), { status: 200 });

  } catch (error) {
    console.error('Error fetching images:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch images' }), { status: 500 });
  }

}



export async function POST(req: NextRequest) {
  // Define your Cloudflare Worker URL (ideally from environment variables)
  const uploadWorkerUrl = process.env.CF_UPLOAD_WORKER_URL || "https://imgupload.furenku.workers.dev"
  // const storageUrl = process.env.CF_STORAGE_WORKER_URL || "https://pub-f4a871c3230a4e8c8af187e83d568036.r2.dev/original/7.jpg"; // "https://media.rodrigofrenk.dev"
  const storageUrl = process.env.CF_STORAGE_WORKER_URL || "https://media.rodrigofrenk.dev"
  const imageWorkerUrl = process.env.CF_IMAGE_WORKER_URL || "https://img.rodrigofrenk.dev"; // Removed default for clarity, ensure it's set
  // const imageWorkerUrl = process.env.CF_IMAGE_WORKER_URL || "http://localhost:8787"; // Removed default for clarity, ensure it's set

  if (!storageUrl) {
    console.error('CF_STORAGE_WORKER_URL environment variable is not set.');
    return NextResponse.json(
      { error: 'Server configuration error: Worker URL missing' },
      { status: 500 }
    );
  }
  if (!imageWorkerUrl) {
    console.error('CF_IMAGE_WORKER_URL  environment variable is not set.');
    return NextResponse.json(
      { error: 'Server configuration error: Worker URL missing' },
      { status: 500 }
    );
  }

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

    if (!file) {
      return NextResponse.json(
        { error: 'No file found in the request' },
        { status: 400 }
      );
    }

    const originalUrl = storageUrl + '/original/' + file.name;

    let result
    
    const breakpoints = {
			xs: 320,
			sm: 640,
			md: 768,
			lg: 1024,
			xl: 1280,
			xxl: 1536,
    };


    type SizeRecord = {
      [ key in Breakpoint ]?: string
    }


    const sizes : SizeRecord = {}


    // Prepare data to forward to the Cloudflare Worker
    try {
      
      const data = new FormData();
      data.append('file', file, file.name);
      

      const uploadWorkerResponse = await fetch(uploadWorkerUrl, {
        method: 'POST',
        body: data,        
      });

      // Check if the worker responded successfully
      if (!uploadWorkerResponse.ok) {
        const errorText = await uploadWorkerResponse.text();
        console.error(`Worker error: ${uploadWorkerResponse.status} ${uploadWorkerResponse.statusText}`, errorText);
        return NextResponse.json(
          {
            error: 'Failed to upload image',
            workerStatus: uploadWorkerResponse.status,
            uploadWorkerResponse: "...", // Include worker response for debugging
          },
          { status: uploadWorkerResponse.status } // Forward the worker's status code
        );
      }

    } catch (error) {
      console.error('Error in POST /api/images:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    
    try {


      const data = new FormData();
      data.append('url', originalUrl);
      data.append('size', 'xs');

      const resizedResponse = await fetch( imageWorkerUrl, {
        method: 'POST',
        body: data
      });

      console.log(resizedResponse);
      

      const uploadWorkerResponse = await fetch(uploadWorkerUrl, {
        method: 'POST',
        body: data,        
      });

      if( ! resizedResponse.ok ) {
        const errorText = await uploadWorkerResponse.text();
        console.error(`Worker error: ${uploadWorkerResponse.status} ${uploadWorkerResponse.statusText}`, errorText);

        return NextResponse.json(
          {
            error: 'Failed to resize image',
            workerStatus: uploadWorkerResponse.status,
            uploadWorkerResponse: errorText, // Include worker response for debugging
          },
          { status: uploadWorkerResponse.status } // Forward the worker's status code
        );
      }

      result = await resizedResponse.blob()


    } catch (error) {
      console.error('Error in reupload:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    try {

      const data = new FormData();

      data.append('file', result, file.name);
      
      data.append('size', 'xs');
    
      const uploadWorkerResponse = await fetch(uploadWorkerUrl, {
        method: 'POST',
        body: data,        
      });

      // Check if the worker responded successfully
      if (!uploadWorkerResponse.ok) {
        const errorText = await uploadWorkerResponse.text();
        console.error(`Worker error: ${uploadWorkerResponse.status} ${uploadWorkerResponse.statusText}`, errorText);
        return NextResponse.json(
          {
            error: 'Failed to upload image',
            workerStatus: uploadWorkerResponse.status,
            uploadWorkerResponse: "...", // Include worker response for debugging
          },
          { status: uploadWorkerResponse.status } // Forward the worker's status code
        );
      }

      sizes['xs'] = storageUrl + '/resized/xs/' + file.name;

      



    } catch (error) {
      console.error('Error in reupload:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  
    return NextResponse.json( {
      original: originalUrl,
      sizes
    }, { status: 201 }); // 201 Created is often suitable for successful POST
      
      



  } catch (error) {
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