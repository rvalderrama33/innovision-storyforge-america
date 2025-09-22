import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  lazy?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  style,
  priority = false,
  lazy = true,
  width,
  height,
  sizes,
  objectFit = 'cover',
  objectPosition = 'center'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority, isInView]);

  // Optimize Unsplash URLs
  const getOptimizedSrc = (originalSrc: string) => {
    if (originalSrc.includes('unsplash.com')) {
      // Remove large width parameters and add optimized ones
      const baseUrl = originalSrc.split('?')[0];
      const optimizedParams = new URLSearchParams({
        'auto': 'format,compress',
        'fit': 'crop',
        'w': width ? width.toString() : '800',
        'h': height ? height.toString() : '600',
        'q': '80',
        'fm': 'webp'
      });
      return `${baseUrl}?${optimizedParams.toString()}`;
    }
    return originalSrc;
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (originalSrc: string) => {
    if (!originalSrc.includes('unsplash.com')) return undefined;
    
    const baseUrl = originalSrc.split('?')[0];
    const widths = [400, 800, 1200, 1600];
    
    return widths.map(w => {
      const params = new URLSearchParams({
        'auto': 'format,compress',
        'fit': 'crop',
        'w': w.toString(),
        'h': height ? Math.round((height * w) / (width || 800)).toString() : Math.round(w * 0.75).toString(),
        'q': '80',
        'fm': 'webp'
      });
      return `${baseUrl}?${params.toString()} ${w}w`;
    }).join(', ');
  };

  const optimizedSrc = getOptimizedSrc(src);
  const srcSet = generateSrcSet(src);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  const combinedStyle: React.CSSProperties = {
    objectFit,
    objectPosition,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded || error ? 1 : 0,
    ...style
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder */}
      {!isLoaded && !error && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ 
            width: width || '100%', 
            height: height || '100%' 
          }}
        />
      )}
      
      {/* Actual image */}
      {(isInView || priority) && (
        <img
          src={optimizedSrc}
          srcSet={srcSet}
          sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          alt={alt}
          className="w-full h-full"
          style={combinedStyle}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          width={width}
          height={height}
        />
      )}

      {/* Error fallback */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <div className="text-2xl">📷</div>
            <div className="text-sm">Image unavailable</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;