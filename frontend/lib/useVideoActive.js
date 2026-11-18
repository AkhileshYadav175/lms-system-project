"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if video playback is currently active.
 * Used across the student portal to pause background canvas effects,
 * unneeded animation loops, and heavy rAF callbacks for zero-stutter 60fps playback.
 */
export function useVideoActive() {
  const [isVideoActive, setIsVideoActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsVideoActive(Boolean(window.__LMS_IS_VIDEO_ACTIVE));

    const handleVideoEvent = (event) => {
      setIsVideoActive(Boolean(event.detail?.active));
    };

    window.addEventListener("video_playback_active", handleVideoEvent);
    return () => {
      window.removeEventListener("video_playback_active", handleVideoEvent);
    };
  }, []);

  return isVideoActive;
}

/**
 * Custom requestAnimationFrame hook that automatically pauses execution
 * while LMS video playback is active.
 */
export function useSmartAnimationFrame(callback) {
  const isVideoActive = useVideoActive();

  useEffect(() => {
    if (isVideoActive || !callback) return;

    let frameId;
    const loop = (time) => {
      callback(time);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isVideoActive, callback]);
}
