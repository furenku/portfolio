"use client";

import Image from 'next/image';
import React, { useState } from 'react';
import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';

// Reusable component for animated image loading with blur placeholder
export const ImageContainer = ({
  src,
  alt,
  width,
  height,
  blurDataURL,
  objectFit = 'cover',
  className = '',
  priority = false, // Add priority prop
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  blurDataURL: string;
  objectFit?: CSSProperties['objectFit'];
  className?: string;
  priority?: boolean; // Add priority prop type
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const dimensions: { [key: string]: number | boolean | undefined } = {};

  // Use width/height for 'contain', otherwise use 'fill'
  if (objectFit === 'contain' && width && height) {
    dimensions.width = width;
    dimensions.height = height;
  } else {
    dimensions.fill = true;
    
  }

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <motion.div
        className={`relative w-full h-full overflow-hidden ${className}`} // Apply className here
        initial={{ opacity: 0.6 }}
        animate={{ opacity: isLoaded ? 1 : 0.6 }}
        transition={{ duration: 0.4 }}
      >
        <Image
          src={src}
          alt={alt}
          loading={priority ? undefined : "lazy"} // Use lazy loading unless priority is set
          priority={priority} // Pass priority to Image
          placeholder={blurDataURL ? 'blur' : 'empty'}
          blurDataURL={blurDataURL}
          onLoadingComplete={() => setIsLoaded(true)}
          style={{ objectFit }}
          {...dimensions}
        />
      </motion.div>
    </div>
  );
};
