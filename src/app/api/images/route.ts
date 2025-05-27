import { NextRequest, NextResponse } from 'next/server';
import { dbCheckPromise, isDbStructureValid } from '@/lib/database/db-check';
import { uploadOriginal } from '@/lib/upload/image-uploader';
import { createResized, createPreviewDataUrl } from '@/lib/processing/image-processor';
import { getImagesFromDb, saveImageToDb } from '@/lib/services/image-service';
import { Image } from 'components-react';

export async function GET() {
  await dbCheckPromise;
  
  if (!isDbStructureValid) {
    console.error("GET /api/images: Aborting because database structure is invalid.");
    return new NextResponse(JSON.stringify({ error: 'Server configuration error: Database structure invalid.' }), { status: 500 });
  }

  try {
    const formattedImages = await getImagesFromDb();
    
    return new NextResponse(JSON.stringify(formattedImages), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fetching images from Supabase:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch images', details: message }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {

  await dbCheckPromise;

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
        { status: 415 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const altText = formData.get('alt') as string | null;
    const caption = formData.get('caption') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file found in the request' },
        { status: 400 }
      );
    }

    // Upload Original
    const didUpload = await uploadOriginal(file);

    if (!didUpload.ok) {
      return NextResponse.json(
        { error: 'Could not upload original image' },
        { status: didUpload.status }
      );
    }

    if (!didUpload.data?.width || !didUpload.data?.height) {
      return NextResponse.json(
        { error: 'Could not get image dimensions' },
        { status: didUpload.status }
      );
    }

    const originalUrl = storageUrl + '/original/' + file.name;

    // Create Resized Versions
    const response = await createResized(file.name, originalUrl);

    if (!response.ok || !response.sizes) {
      return NextResponse.json(
        { error: 'Failed to create resized versions of the image' },
        { status: 500 }
      );
    }

    // Create preview data URL for immediate display

    console.log('Creating preview data URL for the uploaded image', file.name, file.size);
    
    const previewDataUrl = await createPreviewDataUrl(file);

    // Save image metadata to database
    const imageData: Image = {
      name: file.name,
      src: originalUrl,
      alt: altText || '',
      caption: caption || '',
      width: didUpload.data.width,
      height: didUpload.data.height,
      sizes: response.sizes,
      preview: previewDataUrl
    };

    try {
      const savedImage = await saveImageToDb(imageData);

      return NextResponse.json(
        {
          success: true,
          image: savedImage,
          message: 'Image uploaded and processed successfully'
        },
        { status: 201 }
      );

    } catch (dbError) {
      console.error('Error saving image to database:', dbError);

      // If database save fails, we should clean up uploaded files
      // This would require implementing cleanup logic in your image service

      return NextResponse.json(
        {
          error: 'Image uploaded but failed to save metadata',
          details: dbError instanceof Error ? dbError.message : 'Database error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in POST /api/images:', message );
    
    return NextResponse.json(
      { error: 'Failed to process image upload', details: message },
      { status: 500 }
    );
  }
}
