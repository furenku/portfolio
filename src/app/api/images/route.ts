import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { GalleryImage } from '@/components/Gallery';

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

interface ImageData {
  base64?: string;
  width?: number;
  height?: number;
}





// For local files
async function getBase64File(filePath: string): Promise<string> {
  try {
    const imageBuffer = await fs.readFile(filePath);
    const base64 = imageBuffer.toString('base64');
    const metadata = await sharp(imageBuffer).metadata();

    return `data:image/${metadata.format};base64,${base64}`
      
  } catch (error) {
    console.error(`Error processing image file ${filePath}:`, error);
    throw new Error(`Failed to get image data from file: ${filePath}`);
  }
}

// For URLs
async function getBase64Url(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    

    const typeInfo = await fileTypeFromBuffer(buffer);
    let mimeType: string | undefined = typeInfo?.mime;
    if (!mimeType) {
      const contentTypeHeader = response.headers.get('content-type');
      if (contentTypeHeader) {
        mimeType = contentTypeHeader.split(';')[0].trim();
        console.warn(`Could not determine type from buffer for ${url}, using Content-Type header: ${mimeType}`);
      }
    }
    if (!mimeType) {
      console.error(`Could not determine MIME type for URL: ${url} (neither from buffer nor headers)`);
      return ""
    }
    const base64Data= buffer.toString('base64');
    const base64 = `data:${mimeType};base64,${base64Data}`;
    return base64
  } catch (error) {
    console.error(`Error fetching or processing image from URL: ${url}`, error);
    return ""
  }
}






// For local files
async function getImageDataFromFile(filePath: string): Promise<ImageData> {
  try {
    const imageBuffer = await fs.readFile(filePath);
    const metadata = await sharp(imageBuffer).metadata();
    const base64 = imageBuffer.toString('base64');
    if (metadata.width === undefined || metadata.height === undefined) {
      throw new Error(`Could not determine dimensions for image: ${filePath}`);
    }
    return {
      base64: `data:image/${metadata.format};base64,${base64}`,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (error) {
    console.error(`Error processing image file ${filePath}:`, error);
    throw new Error(`Failed to get image data from file: ${filePath}`);
  }
}

// For URLs
async function getImageDataFromUrl(url: string): Promise<ImageData> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let width: number | undefined = undefined;
    let height: number | undefined = undefined;
    try {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width ?? undefined;
      height = metadata.height ?? undefined;
    } catch (sharpError) {
      console.warn(`Could not get dimensions using sharp for ${url}:`, sharpError);
    }
    const typeInfo = await fileTypeFromBuffer(buffer);
    let mimeType: string | undefined = typeInfo?.mime;
    if (!mimeType) {
      const contentTypeHeader = response.headers.get('content-type');
      if (contentTypeHeader) {
        mimeType = contentTypeHeader.split(';')[0].trim();
        console.warn(`Could not determine type from buffer for ${url}, using Content-Type header: ${mimeType}`);
      }
    }
    if (!mimeType) {
      console.error(`Could not determine MIME type for URL: ${url} (neither from buffer nor headers)`);
      return { base64: undefined, width, height };
    }
    const base64Data= buffer.toString('base64');
    const base64 = `data:${mimeType};base64,${base64Data}`;
    return { base64, width, height };
  } catch (error) {
    console.error(`Error fetching or processing image from URL: ${url}`, error);
    return { base64: undefined, width: undefined, height: undefined };
  }
}

export async function GET() {
  try {
    const localPreviewBaseDir = path.join(process.cwd(), 'data/test/images/');

    const rawImages: ApiImage[] = new Array(7).fill(true).map((_, i) => {
      const seed = (Math.random() * 99999).toString();
      return {
        sizes: {
          xl: `https://picsum.photos/seed/${seed}/1920/1080`,
          lg: `https://picsum.photos/seed/${seed}/1024/578`,
          md: `https://picsum.photos/seed/${seed}/768/432`,
          sm: `https://picsum.photos/seed/${seed}/568/320`,
          xs: `https://picsum.photos/seed/${seed}/480/270`
        },
        preview: `https://picsum.photos/seed/${seed}/32/18`,
        alt: 'image ' + (i + 1).toString(),
        caption: 'Caption text for image ' + (i + 1).toString()
      }
    });

    const images: GalleryImage[] = [];

    for (const rawImage of rawImages) {
      const sizesWithInfo: any = {};
      for (const [breakpoint, src] of Object.entries(rawImage.sizes)) {
        if (src.startsWith('http://') || src.startsWith('https://')) {
          const { width, height } = await getImageDataFromUrl(src);
          sizesWithInfo[breakpoint] = {
            src,
            width: width, 
            height: height
          };
        } else {
          const localFilePath = path.join(localPreviewBaseDir, src);
          const { width, height } = await getImageDataFromFile(localFilePath);
          sizesWithInfo[breakpoint] = {
            src,
            width,
            height
          };
        }
      }

      let preview = '';

      if (rawImage.preview) {
        if (rawImage.preview.startsWith('http://') || rawImage.preview.startsWith('https://')) {
          preview = await getBase64Url(rawImage.preview);
          
        } else {
          const localFilePath = path.join(localPreviewBaseDir, rawImage.preview);
          preview = await getBase64File(localFilePath);          
        }
      }

      images.push({
        ...rawImage,
        sizes: sizesWithInfo,
        preview
      });
    }

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error processing gallery images:', error);
    return NextResponse.json({ error: 'Failed to process images' }, { status: 500 });
  }
}