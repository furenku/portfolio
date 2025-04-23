import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Video } from '@/components/Video/Video';

interface VideoRotatorProps {
  videos: Array<{
    webm: string;
    mp4: string;
    poster: string;
    duration?: number; // Estimated duration in seconds
  }>;
  /** Controls if the very first video should be preloaded immediately. Defaults to true. */
  preloadFirstVideo?: boolean;
}

export const VideoRotator: React.FC<VideoRotatorProps> = ({
  videos,
  preloadFirstVideo = true, // Default to true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const preloadedVideosRef = useRef<Map<number, { element: HTMLVideoElement; duration: number }>>(
    new Map()
  );

  // Calculate the total preloaded video duration
  const getTotalPreloadedDuration = useCallback((): number => {
    let total = 0;
    preloadedVideosRef.current.forEach(item => {
      // Ensure duration is a valid number, default to 0 if not
      total += typeof item.duration === 'number' && !isNaN(item.duration) ? item.duration : 0;
    });
    return total;
  }, []); // No dependencies as it only uses the ref


  // Handle video ended event
  const handleVideoEnded = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % videos.length);
  }, [videos.length]); // Dependency on videos.length


  const preloadNext = useCallback((indexToPreload: number) => {
    if (indexToPreload >= videos.length) return; // Stop if index is out of bounds

    const MAX_PRELOAD_DURATION = 60; // 1 minute in seconds
    const currentTotalDuration = getTotalPreloadedDuration();

    // Check if this video is already preloaded or preloading
    if (preloadedVideosRef.current.has(indexToPreload)) {
      // If already loaded, potentially trigger preload for the next one
      preloadNext(indexToPreload + 1);
      return;
    }

    const videoData = videos[indexToPreload];
    if (!videoData) return; // Should not happen with the length check, but good practice

    const videoDuration = typeof videoData.duration === 'number' && !isNaN(videoData.duration) ? videoData.duration : 0; // Default to 0 if invalid/missing

    // If adding this video would exceed our limit (and it has a duration > 0), stop preloading this chain
    if (videoDuration > 0 && currentTotalDuration + videoDuration > MAX_PRELOAD_DURATION) {
      console.log(`Preload limit reached. Stopping preload at index ${indexToPreload}. Total: ${currentTotalDuration}s`);
      return;
    }

    // Create and preload the video element
    const videoEl = document.createElement('video');
    videoEl.preload = 'auto';
    videoEl.src = videoData.mp4 || videoData.webm; // Prefer mp4 or use webm if needed

    // Add sources if using <source> tags is preferred (though setting .src often suffices)
    // const mp4Source = document.createElement('source'); mp4Source.src = videoData.mp4; mp4Source.type = 'video/mp4';
    // const webmSource = document.createElement('source'); webmSource.src = videoData.webm; webmSource.type = 'video/webm';
    // videoEl.appendChild(mp4Source); videoEl.appendChild(webmSource);

    // Mark as preloading (can refine this)
    preloadedVideosRef.current.set(indexToPreload, {
        element: videoEl,
        duration: videoDuration // Store the duration used in calculation
    });


    videoEl.addEventListener('loadeddata', () => {
      console.log(`Video ${indexToPreload} preloaded.`);
      // After this one loads, try preloading the next one in the sequence
      preloadNext(indexToPreload + 1);
    }, { once: true });

    videoEl.addEventListener('error', (e) => {
        console.error(`Error preloading video ${indexToPreload}:`, e);
        // Remove from preloaded map on error?
        preloadedVideosRef.current.delete(indexToPreload);
        // Optionally, try preloading the next one anyway?
        // preloadNext(indexToPreload + 1);
    }, { once: true });


    // Start loading the video resource
    videoEl.load();


  }, [videos, getTotalPreloadedDuration]); // Dependencies


  // Initial preload effect
  useEffect(() => {
    // Start preloading videos starting from index 0
    preloadNext(0);

    // Cleanup function to clear the map when the component unmounts or dependencies change
    return () => {
      preloadedVideosRef.current.forEach(({ element }) => {        
        element.removeEventListener('loadeddata', () => {});
        element.removeEventListener('error', () => {});
      });
      preloadedVideosRef.current.clear();
    };
  }, [preloadNext]); // Rerun if preloadNext function instance changes (due to videos changing)


  // Effect to potentially start playing the video when currentIndex changes
  // This complements the Video component's internal autoplay/preload logic
  useEffect(() => {
    if (videoRef.current) {
      // Attempt to play the new video when the index changes
      // The Video component's useEffect also tries to play, this is an additional trigger
      videoRef.current.play().catch(error => {
        // Autoplay might be blocked, the Video component handles this warning too
        console.log(`Play attempt on index uchange for video ${currentIndex}: ${error.message}`);
      });
    }
  }, [currentIndex]);


  if (!videos || videos.length === 0) {
    return <div>No videos to display.</div>; // Handle empty or invalid videos array
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="VideoRotator relative w-full h-full">
      <Video
        ref={videoRef}
        // Key change forces remount of Video component, ensuring useEffects run correctly for new source
        key={currentIndex}
        videoSources={{ webm: currentVideo.webm, mp4: currentVideo.mp4 }}
        poster={currentVideo.poster}
        onEnded={handleVideoEnded}
        // Preload the first video based on prop, preload subsequent videos immediately when they become current
        preloadImmediately={currentIndex === 0 ? preloadFirstVideo : true}
      />
    </div>
  );

};

// Add display name for better debugging
VideoRotator.displayName = 'VideoRotator';