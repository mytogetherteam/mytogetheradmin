import { useState, useCallback, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LazyImageProps = {
  src?: string | null;
  alt?: string;
  /** Applies to the outer frame (fixed layout / border). */
  className?: string;
  /** Applies to the <img> only (e.g. object-cover, size). */
  imgClassName?: string;
};

/**
 * Lazy-loaded image with broken-state fallback.
 * Uses native `loading="lazy"`; on load error shows a broken-image icon.
 */
export function LazyImage({ src, alt, className, imgClassName }: LazyImageProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleError = useCallback(() => {
    setFailed(true);
  }, []);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
  }, [src]);

  const trimmed = src?.trim();
  const showImg = Boolean(trimmed) && !failed;

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted',
        'h-10 w-10',
        className,
      )}
    >
      {showImg ? (
        <img
          src={trimmed}
          alt={alt || ''}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={handleError}
          onLoad={handleLoad}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
            imgClassName,
          )}
        />
      ) : null}
      {(!trimmed || failed) && (
        <div
          className="absolute inset-0 flex items-center justify-center text-muted-foreground"
          role="img"
          aria-label={alt ? `${alt} (unavailable)` : 'Image unavailable'}
        >
          <ImageOff className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
