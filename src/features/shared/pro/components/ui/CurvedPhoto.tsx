"use client";

import React, { useId } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Photo silhouettes in objectBoundingBox units: full width on the right, then
 * a smooth S-curve up to a raised bottom edge on the left, leaving a notch.
 * `card` is tuned for a ~2.3:1 photo; `hero` for a wider ~3:1 one, with a
 * shallower notch (18% instead of 26%) and proportionally smaller corners.
 */
const PHOTO_CLIP_PATHS = {
  card: "M0.07,0 H0.93 Q1,0 1,0.17 V0.83 Q1,1 0.93,1 H0.6 C0.48,1 0.46,0.74 0.34,0.74 H0.07 Q0,0.74 0,0.57 V0.17 Q0,0 0.07,0 Z",
  hero: "M0.04,0 H0.96 Q1,0 1,0.12 V0.88 Q1,1 0.96,1 H0.6 C0.5,1 0.48,0.82 0.38,0.82 H0.04 Q0,0.82 0,0.7 V0.12 Q0,0 0.04,0 Z",
} as const;

interface CurvedPhotoProps {
  src?: string;
  alt: string;
  /** Tailwind gradient stops shown behind (and instead of) a missing photo. */
  gradient: string;
  /** Large faded icon used when there is no photo. */
  fallbackIcon: React.ElementType;
  sizes: string;
  variant?: keyof typeof PHOTO_CLIP_PATHS;
  /**
   * Wraps the photo in a thin white border of the same silhouette (a white
   * backdrop with the photo inset by 4px).
   */
  framed?: boolean;
  /** Sets the height; the width always fills the parent. */
  className?: string;
  imageClassName?: string;
  /** Overlays (icon chip, APY…) drawn inside the clipped area. */
  children?: React.ReactNode;
}

export function CurvedPhoto({
  src,
  alt,
  gradient,
  fallbackIcon: FallbackIcon,
  sizes,
  variant = "card",
  framed = false,
  className,
  imageClassName,
  children,
}: CurvedPhotoProps) {
  // Older React versions return ":r0:"-style ids, invalid inside url(#…).
  const clipId = `pro-photo-${useId().replace(/:/g, "")}`;
  const clipPath = PHOTO_CLIP_PATHS[variant];

  const photo = (
    <div
      className={cn(
        "relative bg-linear-to-br",
        gradient,
        framed ? "h-full" : className
      )}
      style={{ clipPath: `url(#${clipId})` }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <FallbackIcon
          className="absolute -right-6 -bottom-6 h-32 w-32 text-white/10"
          aria-hidden
        />
      )}
      <div
        className="absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_0%,rgba(0,0,0,0.55)_0%,transparent_70%)]"
        aria-hidden
      />
      {/* A CSS border would ignore the clip-path, so the outline is the
          same path stroked. The clip hides the outer half of the stroke.
          The white frame replaces it when framed. */}
      {!framed && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={clipPath}
            fill="none"
            stroke="#2B2B2A"
            strokeWidth={4}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
      {children}
    </div>
  );

  return (
    <>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={clipPath} />
          </clipPath>
        </defs>
      </svg>

      {framed ? (
        <div
          className={cn("relative bg-white p-1", className)}
          style={{ clipPath: `url(#${clipId})` }}
        >
          {photo}
        </div>
      ) : (
        photo
      )}
    </>
  );
}
