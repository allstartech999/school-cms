import React, { useState } from 'react';

/**
 * Generate an optimized image URL similar to Next.js /_next/image
 * @param {string} src - The original image source path (e.g. /uploads/... or /images/...)
 * @param {Object} options - Optimization options
 * @param {number} [options.width] - Target width in pixels
 * @param {number} [options.quality=75] - Compression quality (10-100)
 * @param {string} [options.format] - Explicit format (webp, jpeg, png)
 * @returns {string} Optimized image URL
 */
export function getOptimizedImageUrl(src, options = {}) {
  if (!src || typeof src !== 'string') return '';

  // If already a full external URL (http/https) not belonging to our domain, return as-is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // If it's a URL on the current host, strip origin
    try {
      const parsed = new URL(src);
      if (typeof window !== 'undefined' && parsed.host === window.location.host) {
        src = parsed.pathname;
      } else {
        return src;
      }
    } catch {
      return src;
    }
  }

  // SVGs or data URIs should not be raster-optimized
  if (src.endsWith('.svg') || src.startsWith('data:')) {
    return src;
  }

  const { width, quality = 75, format } = options;

  // Next.js style query parameters on /api/v1/images
  const params = new URLSearchParams();
  params.set('url', src);
  if (width && width > 0) {
    params.set('w', String(Math.round(width)));
  }
  if (quality && quality > 0) {
    params.set('q', String(quality));
  }
  if (format) {
    params.set('format', format);
  }

  return `/api/v1/images?${params.toString()}`;
}

/**
 * Generate a responsive srcSet string
 * @param {string} src - Image source
 * @param {number[]} widths - Array of widths
 * @param {number} quality - Quality level
 * @returns {string} srcSet string
 */
export function getOptimizedSrcSet(src, widths = [384, 640, 750, 1080, 1200], quality = 75) {
  if (!src || src.endsWith('.svg') || src.startsWith('data:')) return '';
  return widths
    .map(w => `${getOptimizedImageUrl(src, { width: w, quality })} ${w}w`)
    .join(', ');
}

/**
 * OptimizedImage Component
 * Drop-in high-performance image component inspired by Next.js <Image />
 */
export default function OptimizedImage({
  src,
  alt = '',
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  sizes,
  fallbackSrc = '/images/news-active-learning.jpg',
  responsive = false,
  style,
  onLoad,
  ...rest
}) {
  const [imgSrc, setImgSrc] = useState(() => {
    if (!src) return fallbackSrc;
    return getOptimizedImageUrl(src, { width, quality });
  });
  const [hasError, setHasError] = useState(false);

  // Update src when prop changes
  React.useEffect(() => {
    if (!src) {
      setImgSrc(fallbackSrc);
      return;
    }
    setHasError(false);
    setImgSrc(getOptimizedImageUrl(src, { width, quality }));
  }, [src, width, quality, fallbackSrc]);

  const handleError = () => {
    if (!hasError && fallbackSrc && imgSrc !== fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  const srcSet = responsive && !hasError ? getOptimizedSrcSet(src, [384, 640, 750, 1080, 1200], quality) : undefined;

  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      sizes={sizes || (responsive ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : undefined)}
      srcSet={srcSet}
      onError={handleError}
      onLoad={onLoad}
      style={style}
      {...rest}
    />
  );
}
