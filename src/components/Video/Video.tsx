import React, { useEffect, forwardRef } from 'react';

interface VideoProps {
  videoSources: {
    webm: string;
    mp4: string;
  };
  poster: string;
  className?: string;
  onEnded?: () => void;
  /** Preload the video immediately if true, otherwise lazy load on intersection. Defaults to false. */
  preloadImmediately?: boolean;
}

export const Video = forwardRef<HTMLVideoElement, VideoProps>(({
  videoSources,
  poster,
  className,
  onEnded,
  preloadImmediately = false,
}, ref) => {
  

  useEffect(() => {
    const video = ref instanceof Object ? (ref as React.RefObject<HTMLVideoElement>).current : null;
    if (!video || preloadImmediately) return; // Skip observer if preloading immediately

    // Lazy load for videos not preloaded
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && video) {
            // Set preload to auto only when intersecting and not already preloading
            if (video.getAttribute('preload') !== 'auto') {
              video.setAttribute('preload', 'auto');
              // Optionally, try playing again if autoplay failed initially and element is now visible
              // video.play().catch(err => console.error("Failed to play video on intersection:", err));
            }
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '200px', // Start loading when video is 200px away from viewport
        threshold: 0.01, // Trigger even if only 1% is visible
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [ref, preloadImmediately]); // Add preloadImmediately to dependency array

  // Initialize video whenever sources change
  useEffect(() => {

    const initializeVideo = () => {
      const video = ref instanceof Object ? (ref as React.RefObject<HTMLVideoElement>).current : null;
      if (!video) return;
  
      // Reset the video element
      video.load();
  
      // Check autoplay support
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // Fallback or log error if needed, current implementation hides video which might not be ideal
          console.warn('Video autoplay failed.');
          // Consider alternative fallback, e.g., show poster with a play button
        });
      }
    };
    
    initializeVideo();
    // Dependency array includes ref handling, consider if initializeVideo should run if ref changes
  }, [videoSources, ref]); // Include ref in dependencies

  return (
    <div className={`relative overflow-hidden ${className || ''}`}> {/* Use relative and overflow-hidden */}
      <video
        ref={ref}
        autoPlay
        muted // Autoplay usually requires muted
        playsInline // Important for iOS inline playback
        preload={preloadImmediately ? 'auto' : 'metadata'} // Conditional preload
        poster={poster}
        onEnded={onEnded}
        className='contrast-125 brightness-85' // Consider moving styles to CSS/Tailwind classes if reusable
        style={{          
          width: '100%',
          height: '100%',
          objectFit: 'cover',                    
        }}
      >
        {Object.entries(videoSources).map(([type, src]) => (
          <source key={type} src={src} type={`video/${type}`} />
        ))}
        Your browser does not support the video tag. {/* Fallback text */}
      </video>

    </div>
  );
});

// Add display name for better debugging
Video.displayName = 'Video';