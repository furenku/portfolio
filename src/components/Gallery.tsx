"use client";

// Gallery.tsx
import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface GalleryImage {
  src: string;
  alt?: string;
}

interface GalleryProps {
  images: GalleryImage[];
  aspectRatio?: string | null;
  className?: string;
}

const Gallery: React.FC<GalleryProps> = ({
  images,
  aspectRatio = null,
  className = '',
}) => {
  const [autoRatio, setAutoRatio] = useState<string | null>(null);
  const mainImgRef = useRef<HTMLImageElement>(null);

  const [main, ...thumbs] = images;
  const effectiveRatio = useMemo(() => aspectRatio ?? autoRatio, [aspectRatio, autoRatio]);

  useEffect(() => {
    if (!aspectRatio && mainImgRef.current) {
      const { naturalWidth, naturalHeight } = mainImgRef.current;
      if (naturalWidth && naturalHeight) {
        setAutoRatio(`${naturalWidth}/${naturalHeight}`);
      }
    }
  }, [aspectRatio, mainImgRef.current?.src]);

  if (!main) return null;

  const RatioBox: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => (
    <div
      className="relative w-full overflow-hidden rounded"
      style={effectiveRatio ? { aspectRatio: effectiveRatio } : undefined}
    >
      {children}
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-1 md:grid-cols-[2fr_1fr]">
        <RatioBox>
          <Image
            ref={mainImgRef}
            src={main.src}
            alt={main.alt ?? 'Main image'}
            fill
            className="object-cover"
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 66vw"
          />
        </RatioBox>

        {thumbs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2">
            {thumbs.map((img, i) => (
              <RatioBox key={img.src + i}>
                <Image
                  src={img.src}
                  alt={img.alt ?? `Thumbnail ${i + 1}`}
                  layout="fill"
                  objectFit="cover"
                  loading="lazy"
                />
              </RatioBox>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
