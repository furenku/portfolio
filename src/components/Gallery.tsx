"use client";

import Image from 'next/image';
import React from 'react';
export interface GalleryImage {
  src: string;
  alt?: string;
}

interface GalleryProps {
  images: GalleryImage[];
  className?: string;
  // aspectRatio prop is removed as we aim to fill the container
}

// A simple container component to wrap images and ensure they fill their parent
const ImageContainer: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`relative w-full h-full rounded overflow-hidden ${className}`}>
      {children}
    </div>
  );

const Gallery: React.FC<GalleryProps> = ({
  images,
  className = '',
}) => {
  // No need for aspect ratio state or calculation anymore
  // const [autoRatio, setAutoRatio] = useState<string | null>(null);
  // const mainImgRef = useRef<HTMLImageElement>(null);
  // const effectiveRatio = useMemo(() => aspectRatio ?? autoRatio, [aspectRatio, autoRatio]);
  // useEffect(() => { ... });

  if (!images || images.length === 0) return null;

  const main = images[0]
  const thumbs = images.slice(1);

  return (
    // Ensure the main container takes full width and height passed by parent
    <div className={`w-full h-full ${className}`}>
      {/* The main grid layout, now taking full height */}
      <div className="flex flex-col md:flex-row h-full">
        {/* Main image container */}

        <div className="w-full md:w-[60%] xl:w-[50%] h-[66%] md:h-full">
        <ImageContainer>
          <Image
            src={main.src}
            alt={main.alt ?? 'Main image'}
            fill // Use fill to take up container size
            className="object-cover" // Cover ensures image fills, cropping if needed
            loading="eager" // Load main image eagerly
            priority // Prioritize loading the main image
            sizes="(max-width: 768px) 100vw, 66vw" // Keep sizes for optimization
          />
          </ImageContainer>
        </div>


        {thumbs.length > 0 && (
          <div className="flex flex-wrap flex-1 md:flex-col h-[34%] md:h-full overflow-hidden">
            
            {thumbs.map((img, i) => (
              // Each thumbnail uses the ImageContainer to fill its grid cell
              <div className="w-[50%] md:w-full xl:w-[50%] h-full md:h-[50%]"  key={img.src + i}>
                
                <ImageContainer>
                  <Image
                    src={img.src}
                    alt={img.alt ?? `Thumbnail ${i + 1}`}
                    fill // Use fill to take up container size
                    className="object-cover" // Cover ensures image fills, cropping if needed
                    loading="lazy" // Lazy load thumbnails
                    // Adjust sizes for thumbnails if needed, though 'fill' often suffices
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 16vw, 11vw"
                  />
                </ImageContainer>
              </div>

            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
