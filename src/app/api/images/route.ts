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
    

    const host = process.env.NEXT_PUBLIC_HOST || 'http://localhost:3000';
    

    const rawImages: GalleryImage[] = new Array(7).fill(true).map((_, i) => ({
        sizes: {
          xl: `${host}/images/components/gallery/responsiveimages/xl/${i+1}.png`,
          lg: `${host}/images/components/gallery/responsiveimages/lg/${i+1}.png`,
          md: `${host}/images/components/gallery/responsiveimages/md/${i+1}.png`,
          sm: `${host}/images/components/gallery/responsiveimages/sm/${i+1}.png`,
          xs: `${host}/images/components/gallery/responsiveimages/xs/${i+1}.png`,
          // xl: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/1920`,
          // lg: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/1024`,
          // md: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/768`,
          // sm: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/568`,
          // xs: `https://picsum.photos/seed/${(Math.random()*99999).toString()}/480`
        },
        base64: `base64/base64_${i+1}.jpg`,

        alt: 'image ' + (i+1).toString(),
        caption: 'Caption text for image ' + (i+1).toString()
    }))  
    

    console.log("\n\ntest\n\n", rawImages[0].sizes);
    

    const images = []
    
    for (const rawImage of rawImages) {


        const base64Path = path.join(
          process.cwd(),
          'data/test/images/'+rawImage.base64 || ''
        );
        
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