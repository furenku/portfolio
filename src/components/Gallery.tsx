"use client";

import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';




export interface GalleryImage {
  src: string;
  alt?: string;
  caption?: string;
  sizes: {
    [key in Breakpoint]: string;
  }
}

interface GalleryProps {
  images: GalleryImage[];
  className?: string;
}

// Tailwind breakpoints (adjust if your config differs)
const BREAKPOINTS = {
  lg: 1024,
  xl: 1280,
};

const getVisibleThumbCount = (width: number): number => {
  if (width >= BREAKPOINTS.xl) {
    return 6; // xl: 6 thumbs
  } else if (width >= BREAKPOINTS.lg) {
    return 4; // lg: 4 thumbs
  }
  return 2; // default: 2 thumbs
};


const getBreakpoint = (width: number): Breakpoint => {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= 768) return 'md';
  if (width >= 640) return 'sm';
  return 'xs';
};

const pickImageSrc = (img: GalleryImage, bp: Breakpoint): string => {
  if ( ! img.sizes[bp]) return img.src || ""

  return img.sizes[bp];
};


const ImageContainer: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`relative w-full h-full overflow-hidden ${className}`}>
    {children}
  </div>
);

const Gallery: React.FC<GalleryProps> = ({
  images,
  className = '',
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actualImages, setActualImages] = useState<GalleryImage[]>([]);
  const [visibleThumbCount, setVisibleThumbCount] = useState(2); // Default count

  // Effect to update visible thumb count on resize
  useEffect(() => {
    const handleResize = () => {
      setVisibleThumbCount(getVisibleThumbCount(window.innerWidth));
    };

    // Set initial count
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array ensures this runs only on mount and cleanup

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (lightboxOpen) {
        if (event.key === 'ArrowRight') {
          nextImage();
        } else if (event.key === 'ArrowLeft') {
          prevImage();
        } else if (event.key === 'Escape') {
          closeLightbox();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxOpen, nextImage, prevImage]);


  useEffect(() => {
    // Store all potential thumbnails (excluding the main image)
    if (images.length > 1) {
      setActualImages(images);
    } else {
      setActualImages([]);
    }
  }, [images]);

  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => getBreakpoint(typeof window !== 'undefined' ? window.innerWidth : 0));

  useEffect(() => {
    const handleResize = () => setBreakpoint(getBreakpoint(window.innerWidth));
    handleResize(); // Set initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  if (!images || images.length === 0) return null;


  
  // Slice the thumbnails based on the calculated visible count for rendering
  const visibleThumbs = actualImages.slice(1, visibleThumbCount + 1);
  const main = actualImages[0];


  return (
    <div className={`w-full h-full ${className}`}>
      <div className="flex flex-col md:flex-row h-full">
        {/* Main Image */}
        { main && (
            <div className="w-full md:w-[60%] xl:w-[50%] h-[66%] md:h-full cursor-pointer" onClick={() => openLightbox(0)}>
            <ImageContainer>
              <Image
                src={pickImageSrc(main, breakpoint)}
                alt={main.alt ?? 'Main image'}
                fill
                className="object-cover"
                loading="eager"
                priority
                sizes="(max-width: 768px) 100vw, 66vw"
              />
            </ImageContainer>
          </div>
        )}

        {/* Thumbnails Area */}
        {/* Only render this div if there are actually thumbs to show */}
        {visibleThumbs.length > 0 && (
          // Note: The grid classes define layout structure, not the number of items.
          // This will show *up to* 2, 4, or 6 items within the defined grid.
          // The layout might look sparse on larger screens if few images are provided.
          <div className="flex flex-1 md:grid md:grid-cols-1 md:grid-rows-2 lg:grid-cols-2 xl:grid-cols-3 overflow-y-scroll">
            {visibleThumbs.map((img, i) => (
              // Calculate the correct original index for the lightbox
              // The index `i` is relative to `visibleThumbs`, but we need the index within the full `images` array
              <div className="flex-1 h-full cursor-pointer" key={img.src + i} onClick={() => openLightbox(i + 1)}>
                <ImageContainer>
                  <Image
                    src={pickImageSrc(img, 'xs')}

                    alt={img.alt ?? `Thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 16vw, 11vw"
                  />
                </ImageContainer>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">

          <button aria-label="Close lightbox" className="absolute top-4 right-4 text-white text-2xl z-10" onClick={closeLightbox}>✕</button>
          <button aria-label="Previous image" className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl z-10" onClick={prevImage}>❮</button>
          <button aria-label="Next image" className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl z-10" onClick={nextImage}>❯</button>
          <div className="relative w-[calc(100%-8rem)] h-[calc(100%-6rem)]">
            <Image
              src={pickImageSrc(images[currentIndex], breakpoint)}
              alt={images[currentIndex].alt ?? 'Image'}
              fill
              className="object-contain"
              loading="eager" // Load lightbox image eagerly when opened
              priority={true}   // Prioritize loading lightbox image
              sizes="90vw"
            />
          </div>

          <footer className="w-full h-12 flex flex-col items-center justify-center gap-2 mt-1 absolute bottom-2">
            {/* Caption */}
            {(images[currentIndex].caption || images[currentIndex].alt) && (
               <div className="text-sm text-gray-200 px-4 text-center truncate">
                {images[currentIndex].caption || images[currentIndex].alt}
               </div>
            )}
            {/* Pagination Dots */}
            <div className="pagination flex items-center justify-center gap-1.5">
              {images.map((_, index) => (
                <button
                  key={index}
                  aria-label={`Go to image ${index + 1}`}
                  className={`w-2 h-2 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-gray-600'} transition-colors duration-200 hover:bg-gray-400`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </footer>

        </div>
      )}
    </div>
  );
};

export default Gallery;