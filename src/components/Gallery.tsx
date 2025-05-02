"use client";

import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react'; // Import CSSProperties
import useMeasure from "react-use-measure";
import { motion } from 'framer-motion'



type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type Dimensions = {
  width?: number;
  height?: number;
}

export type ImageSize = {
  src: string
} & Dimensions;

export type GalleryImage = {
  alt?: string;
  caption?: string;
  preview?: string;
} & (
  | { src: string; sizes?: { [key in Breakpoint]: ImageSize } }
  | { sizes: {
    [key in Breakpoint]: ImageSize
  };
  src?: string }
) & Dimensions;

interface GalleryProps {
  images: GalleryImage[];
  className?: string;
}

// Tailwind breakpoints (adjust if your config differs)
const BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
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

  let bp: Breakpoint = 'xs';

  Object.entries(BREAKPOINTS).forEach(([key, value]) => {
    if (width >= value) {
      bp = key as Breakpoint;
    }
  });

  return bp;

};

const pickImageSize = (img: GalleryImage, bp: Breakpoint): ImageSize | undefined => {
  
  if( ! img.sizes || ! img.sizes[bp] ) return
  
  return img.sizes[bp];

};


const AnimatedBlurImage = ({ src, alt, width, height, blurDataURL, objectFit='cover'  } : { src: string, alt: string, width?: number, height?: number,blurDataURL: string, objectFit?: CSSProperties['objectFit']  }) => {
  const [isLoaded, setIsLoaded] = useState(false)

  const dimensions: {
    [key: string]: number | undefined
  } = {}

  if( objectFit === 'contain' ) {
    dimensions.width = width
    dimensions.height = height
  }


  return (
    <div className="overflow-hidden rounded-2xl w-full max-w-md bg-gray-200">
      <motion.div
        initial={{ opacity: 0.6 }}
        animate={{ opacity: isLoaded ? 1 : 0.6 }}
        transition={{ duration: 0.4 }}        
      >

          <Image
            src={src}
            alt={alt}
            fill
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            placeholder={ blurDataURL ? "blur" : "empty" }
            blurDataURL={blurDataURL}
            onLoadingComplete={() => setIsLoaded(true)}
            style={{
              objectFit
            }}
            {...dimensions}
          />


      </motion.div>
    </div>
  )
}

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

  const [mainImageRef, bounds] = useMeasure();

  const width = bounds.width;

  let mainBreakpoint: Breakpoint | undefined = undefined;

  if (width) {
    mainBreakpoint = getBreakpoint(width * 1.25);
  }

  


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
            <div className="main-image w-full md:w-[60%] xl:w-[50%] h-[66%] md:h-full cursor-pointer" onClick={() => openLightbox(0)}
            ref={mainImageRef}
            >
              {
                mainBreakpoint ? (
                  <ImageContainer><AnimatedBlurImage
                    src={pickImageSize(main, mainBreakpoint)?.src || ''}
                    alt={main.alt ?? 'Main image'}
                    blurDataURL={main.preview || "" }
                    width={ main.width }
                    height={ main.height }
                  /></ImageContainer>
                ) : (
                  <div className="w-full h-full bg-gray-200 animate-pulse"></div>
              )}
            
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
              <div className="flex-1 h-full cursor-pointer" key={i} onClick={() => openLightbox(i + 1)}>
                <ImageContainer>
                  <AnimatedBlurImage
                    src={
                      pickImageSize(img, 'xs')?.src || ""
                    }
                    alt={img.alt ?? `Thumbnail ${i + 1}`}
                    blurDataURL={ img.preview || "" }
                    width={ img.width }
                    height={ img.height }  
                  />
                </ImageContainer>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col gap-4 items-center justify-center z-50">

          <button aria-label="Close lightbox" className="absolute top-4 right-4 text-white text-2xl z-10" onClick={closeLightbox}>✕</button>
          <button aria-label="Previous image" className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl z-10" onClick={prevImage}>❮</button>
          <button aria-label="Next image" className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl z-10" onClick={nextImage}>❯</button>
          <div className="relative w-[calc(100%-8rem)] h-[calc(100%-8rem)]">
            <AnimatedBlurImage
              src={pickImageSize(images[currentIndex], breakpoint)?.src || "" }
              alt={images[currentIndex].alt ?? 'Image'}
              blurDataURL={ images[currentIndex].preview || "" }
              objectFit='contain'
              width={ images[currentIndex].width }
              height={ images[currentIndex].height }
            />
          </div>

          <footer className="w-full h-12 flex flex-col items-center justify-center gap-2 absolute bottom-2">
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