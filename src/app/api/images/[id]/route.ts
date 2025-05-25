import { NextRequest, NextResponse } from 'next/server';
import { dbCheckPromise, getIsDbStructureValid } from '@/lib/database/supabase-client';
import { createResized } from '@/lib/processing/image-processor';
import { Breakpoint } from '@/types/media-server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbCheckPromise;

  if (!getIsDbStructureValid()) {
    console.error("POST /api/images/[id]: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const { size } = await req.json();
    
    if (!size || !['xs', 'sm', 'md', 'lg', 'xl'].includes(size)) {
      return NextResponse.json(
        { error: 'Invalid or missing size parameter' },
        { status: 400 }
      );
    }

    const storageUrl = process.env.CF_STORAGE_WORKER_URL;
    const filename = params.id;
    const originalUrl = storageUrl + '/original/' + filename;

    const response = await createResized(filename, originalUrl, size as Breakpoint);

    if (!response.ok || !response.data) {
      return NextResponse.json(
        { error: 'Could not create resized image' },
        { status: response.status }
      );
    }

    return NextResponse.json(response.data, { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing resize request:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to resize image', details: message },
      { status: 500 }
    );
  }
}