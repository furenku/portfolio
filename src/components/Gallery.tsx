"use client";

import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';

export interface GalleryImage {
  src: string;
  alt?: string;
  caption?: string;
}

interface GalleryProps {
  images: GalleryImage[];
  className?: string;
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

  if (!images || images.length === 0) return null;

  const main = images[0];
  const thumbs = images.slice(1);

  return (
    <div className={`w-full h-full ${className}`}>
      <div className="flex flex-col md:flex-row h-full">
        <div className="w-full md:w-[60%] xl:w-[50%] h-[66%] md:h-full cursor-pointer" onClick={() => openLightbox(0)}>
          <ImageContainer>
            <Image
              src={main.src}
              alt={main.alt ?? 'Main image'}
              fill
              className="object-cover"
              loading="eager"
              priority
              sizes="(max-width: 768px) 100vw, 66vw"
            />
          </ImageContainer>
        </div>

        {thumbs.length > 0 && (
          <div className="flex flex-wrap flex-1 md:flex-col h-[34%] md:h-full overflow-hidden">
            {thumbs.map((img, i) => (
              <div className="w-[50%] md:w-full xl:w-[50%] h-full md:h-[50%] cursor-pointer" key={img.src + i} onClick={() => openLightbox(i + 1)}>
                <ImageContainer>
                  <Image
                    src={img.src}
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

      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <button className="absolute top-4 right-4 text-white text-2xl" onClick={closeLightbox}>✕</button>
          <button className="absolute left-4 text-white text-2xl" onClick={prevImage}>❮</button>
          <button className="absolute right-4 text-white text-2xl" onClick={nextImage}>❯</button>
          <div className="relative w-[90%] h-[95%]">
            <Image
              src={images[currentIndex].src}
              alt={images[currentIndex].alt ?? 'Lightbox image'}
              fill
              className="object-contain"
              loading="eager"
              priority
              sizes="90vw"
            />
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white text-center">
              {images[currentIndex].caption || images[currentIndex].alt}
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full ${index === currentIndex ? 'bg-white' : 'bg-gray-400'}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;