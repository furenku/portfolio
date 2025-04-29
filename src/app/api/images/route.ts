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
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL || `https://imgresize.furenku.workers.dev/`;

  if (!workerUrl) {
    console.error('CLOUDFLARE_WORKER_URL environment variable is not set.');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    // Basic check for multipart/form-data
    if (!contentType.includes('multipart/form-data')) {
       return NextResponse.json(
         { error: 'Invalid content type, expected multipart/form-data' },
         { status: 415 } // Unsupported Media Type
       );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file found in form data' }, { status: 400 });
    }

    // Prepare data to forward to the worker
    const workerFormData = new FormData();
    workerFormData.append('file', file, file.name); // Pass the file with its name

    console.log(`Forwarding file "${file.name}" to worker: ${workerUrl}`);

    // Send the file to the Cloudflare Worker
    const workerResponse = await fetch(workerUrl, {
      method: 'POST',
      body: workerFormData,
      // Let fetch set the Content-Type header automatically for FormData
    });

    // Log the response from the worker
    const workerResponseBody = await workerResponse.text(); // Read body as text
    console.log(`Worker response status: ${workerResponse.status}`);
    console.log(`Worker response body:\n---\n${workerResponseBody}\n---`);

    // Return a response based on the worker's result
    return new NextResponse(workerResponseBody, {
      status: workerResponse.status,
      headers: {
        // You might want to proxy some headers from the worker if needed
        'Content-Type': workerResponse.headers.get('Content-Type') || 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in POST /api/images:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: message },
      { status: 500 }
    );
  }
}