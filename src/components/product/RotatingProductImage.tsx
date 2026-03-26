import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type RotatingProductImageProps = {
  images: string[];
  alt: string;
  className?: string;
  containerClassName?: string;
  intervalMs?: number;
};

export function RotatingProductImage({
  images,
  alt,
  className,
  containerClassName,
  intervalMs = 2500,
}: RotatingProductImageProps) {
  const safeImages = useMemo(
    () =>
      (images ?? [])
        .map((img) => String(img || "").trim())
        .filter(Boolean)
        .filter((img, i, arr) => arr.indexOf(img) === i),
    [images],
  );
  const [index, setIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const transitionMs = 520;

  useEffect(() => {
    setIndex(0);
    setPrevIndex(null);
    setAnimating(false);
  }, [safeImages.length]);

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((current) => {
        setPrevIndex(current);
        setAnimating(true);
        return (current + 1) % safeImages.length;
      });
    }, Math.max(1200, intervalMs));
    return () => window.clearInterval(timer);
  }, [safeImages.length, intervalMs]);

  useEffect(() => {
    if (!animating) return;
    const timer = window.setTimeout(() => {
      setAnimating(false);
      setPrevIndex(null);
    }, transitionMs);
    return () => window.clearTimeout(timer);
  }, [animating]);

  if (safeImages.length === 0) return null;

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      {prevIndex !== null && (
        <img
          src={safeImages[prevIndex]}
          alt={alt}
          className={cn(
            "absolute inset-0 h-full w-full object-contain will-change-transform will-change-filter",
            "transition-[transform,opacity,filter] duration-[520ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
            animating ? "-translate-x-8 opacity-0 blur-[1.5px]" : "translate-x-0 opacity-100 blur-0",
            className,
          )}
          loading="lazy"
        />
      )}
      <img
        src={safeImages[index]}
        alt={alt}
        className={cn(
          "absolute inset-0 h-full w-full object-contain will-change-transform will-change-filter",
          "transition-[transform,opacity,filter] duration-[520ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          animating ? "translate-x-8 opacity-0 blur-[2px]" : "translate-x-0 opacity-100 blur-0",
          className,
        )}
        loading="lazy"
      />
    </div>
  );
}
