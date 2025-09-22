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

  // Optimize Unsplash URLs with aggressive compression
  const getOptimizedSrc = (originalSrc: string) => {
    if (originalSrc.includes('unsplash.com')) {
      const baseUrl = originalSrc.split('?')[0];
      const optimizedParams = new URLSearchParams({
        'auto': 'format,compress',
        'fit': 'crop',
        'w': width ? Math.min(width, 800).toString() : '400',
        'h': height ? Math.min(height, 600).toString() : '300',
        'q': '70', // Lower quality for better compression
        'fm': 'webp',
        'cs': 'srgb',
        'dpr': '1' // Force 1x DPR to avoid huge images
      });
      return `${baseUrl}?${optimizedParams.toString()}`;
    }
    return originalSrc;
  };

  // Generate smaller srcSet for better performance
  const generateSrcSet = (originalSrc: string) => {
    if (!originalSrc.includes('unsplash.com')) return undefined;
    
    const baseUrl = originalSrc.split('?')[0];
    const widths = [320, 640, 800]; // Smaller, more realistic widths
    
    return widths.map(w => {
      const params = new URLSearchParams({
        'auto': 'format,compress',
        'fit': 'crop',
        'w': w.toString(),
        'h': height ? Math.round((height * w) / (width || 800)).toString() : Math.round(w * 0.75).toString(),
        'q': '70', // Lower quality
        'fm': 'webp',
        'cs': 'srgb',
        'dpr': '1'
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