import { NextResponse } from 'next/server';
type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface GalleryImage {
  src: string;
  alt?: string;
  caption?: string;
  sizes: {
    [key in Breakpoint]: string;
  },
  base64: string; // Leave blank for now
}

export async function GET() {
    try {
        const images: GalleryImage[] = [
        {
            src: '/images/example1.jpg',
            alt: 'Example Image 1',
            caption: 'This is an example image.',
            sizes: {
            xs: '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw',
            sm: '(min-width: 641px) and (max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
            md: '(min-width: 769px) and (max-width: 1024px) 100vw, (max-width: 1200px) 50vw, 33vw',
            lg: '(min-width: 1025px) and (max-width: 1280px) 100vw, (max-width: 1200px) 50vw, 33vw',
            xl: '100vw'
            },
            base64: ''
        }
        ];
        // Simulate a delay to mimic a real API call

        return NextResponse.json(images);
    } catch (error) {
        console.error('Error fetching gallery images:', error);
        return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }
}