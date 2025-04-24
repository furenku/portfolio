import { NextResponse } from 'next/server';
import { promises as fs } from 'fs'; // Node.js fs/promises
import path from 'path';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface GalleryImage {
  src?: string;
  alt?: string;
  caption?: string;
  sizes: {
    [key in Breakpoint]: string;
  },
  base64?: string; // Leave blank for now
}

async function getBase64FromFile(filePath: string): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    return fileBuffer.toString('base64');
  } catch (err) {
    console.error('Error reading file:', filePath, err);
    return '';
  }
}

export async function GET() {
  try {
    // - If your Next.js root is at the project root,
    // - `process.cwd()` will be the root (where package.json is).
    const base64Path = path.join(
      process.cwd(),
      'data/test/images/base64/xs_7.jpg' // remove @; use relative from process.cwd()
    );



    const rawImages: GalleryImage[] = new Array(7).fill(true).map((_, i) => ({
        src: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/480`,
        sizes: {
          xl: `https://picsum.photos/seed/${(Math.random()*99999).toString()}1/920`,
          lg: `https://picsum.photos/seed/${(Math.random()*99999).toString()}1/024`,
          md: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/768`,
          sm: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/568`,
          xs: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/480`
        },
        alt: 'image ' + (6-i).toString(),
        caption: 'Caption text for image ' + (6-i).toString()
    }))  
    
    const images = []
    
    for (const rawImage of rawImages) {
        const base64 = await getBase64FromFile(base64Path);
        images.push({
            ...rawImage,
            base64: base64 ? `data:image/jpeg;base64,${base64}` : ""
        })
    }
    
    

    return NextResponse.json(images);

  } catch (error) {
    console.error('Error fetching gallery images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}