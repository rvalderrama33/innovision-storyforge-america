import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Play, Maximize2, X, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  index: number;
}

interface MediaGalleryProps {
  images: string[];
  videoUrls: string[];
  primaryIndex?: number;
  productName?: string;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
  images = [],
  videoUrls = [],
  primaryIndex = 0,
  productName = ''
}) => {
  // Combine images and videos into a single media array
  const mediaItems: MediaItem[] = [
    ...images.map((url, index) => ({ type: 'image' as const, url, index })),
    ...videoUrls.map((url, index) => ({ type: 'video' as const, url, index: images.length + index }))
  ];

  const [selectedIndex, setSelectedIndex] = useState(() => {
    // Ensure primary index is within bounds
    return Math.max(0, Math.min(primaryIndex, mediaItems.length - 1));
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const currentMedia = mediaItems[selectedIndex];

  // Handle touch gestures for mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && selectedIndex < mediaItems.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
    if (isRightSwipe && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const isVimeoUrl = (url: string) => {
    return url.includes('vimeo.com');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
  };

  const getVimeoEmbedUrl = (url: string) => {
    const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
    return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : url;
  };

  const renderThumbnail = (item: MediaItem, index: number) => {
    const isSelected = index === selectedIndex;
    
    return (
      <button
        key={index}
        onClick={() => setSelectedIndex(index)}
        className={cn(
          "relative w-16 h-16 md:w-20 md:h-20 border-2 rounded-lg overflow-hidden transition-all duration-200 flex-shrink-0",
          isSelected 
            ? "border-primary ring-2 ring-primary/20" 
            : "border-border hover:border-primary/50"
        )}
        aria-label={
          item.type === 'video' 
            ? `Video thumbnail ${index + 1}` 
            : `Product image ${index + 1} of ${productName}`
        }
      >
        {item.type === 'video' ? (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <Play className="w-6 h-6 text-primary" fill="currentColor" />
          </div>
        ) : (
          <img
            src={item.url}
            alt={`${productName} image ${index + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
      </button>
    );
  };

  const renderMainMedia = () => {
    if (!currentMedia) return null;

    if (currentMedia.type === 'video') {
      if (isYouTubeUrl(currentMedia.url) || isVimeoUrl(currentMedia.url)) {
        const embedUrl = isYouTubeUrl(currentMedia.url) 
          ? getYouTubeEmbedUrl(currentMedia.url)
          : getVimeoEmbedUrl(currentMedia.url);
          
        return (
          <iframe
            src={embedUrl}
            className="w-full aspect-square object-cover rounded-lg"
            allowFullScreen
            title={`${productName} video`}
          />
        );
      } else {
        return (
          <video
            ref={videoRef}
            src={currentMedia.url}
            className="w-full aspect-square object-cover rounded-lg"
            controls
            autoPlay
            muted
            playsInline
            aria-label={`${productName} video`}
          />
        );
      }
    } else {
      return (
        <img
          src={currentMedia.url}
          alt={`${productName} - Main image`}
          className="w-full aspect-square object-cover rounded-lg cursor-pointer"
          onClick={() => setIsFullscreen(true)}
        />
      );
    }
  };

  const renderFullscreenMedia = () => {
    if (!currentMedia) return null;

    if (currentMedia.type === 'video') {
      if (isYouTubeUrl(currentMedia.url) || isVimeoUrl(currentMedia.url)) {
        const embedUrl = isYouTubeUrl(currentMedia.url) 
          ? getYouTubeEmbedUrl(currentMedia.url)
          : getVimeoEmbedUrl(currentMedia.url);
          
        return (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            title={`${productName} video - Fullscreen`}
          />
        );
      } else {
        return (
          <video
            src={currentMedia.url}
            className="max-w-full max-h-full object-contain"
            controls
            autoPlay
            playsInline
            aria-label={`${productName} video - Fullscreen`}
          />
        );
      }
    } else {
      return (
        <img
          src={currentMedia.url}
          alt={`${productName} - Fullscreen view`}
          className="max-w-full max-h-full object-contain"
        />
      );
    }
  };

  if (mediaItems.length === 0) {
    return (
      <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
        <Package className="w-24 h-24 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="md:flex md:gap-4">
      {/* Desktop Thumbnails - Left Column */}
      {mediaItems.length > 1 && (
        <div className="hidden md:flex md:flex-col md:gap-2 md:w-24 md:max-h-96 md:overflow-y-auto">
          {mediaItems.map((item, index) => renderThumbnail(item, index))}
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Main Media Display */}
        <div 
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
        {renderMainMedia()}
        
        {/* Fullscreen button for images */}
        {currentMedia?.type === 'image' && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsFullscreen(true)}
            aria-label="View fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}

        {/* Navigation arrows for desktop */}
        {mediaItems.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hidden md:flex"
              onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
              disabled={selectedIndex === 0}
              aria-label="Previous media"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hidden md:flex"
              onClick={() => setSelectedIndex(Math.min(mediaItems.length - 1, selectedIndex + 1))}
              disabled={selectedIndex === mediaItems.length - 1}
              aria-label="Next media"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}
        </div>

        {/* Mobile Thumbnails - Horizontal scroll */}
        {mediaItems.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 md:hidden">
            {mediaItems.map((item, index) => renderThumbnail(item, index))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-screen-xl w-full h-full p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setIsFullscreen(false)}
              aria-label="Close fullscreen"
            >
              <X className="w-6 h-6" />
            </Button>
            
            {renderFullscreenMedia()}
            
            {/* Fullscreen navigation */}
            {mediaItems.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                  disabled={selectedIndex === 0}
                  aria-label="Previous media"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => setSelectedIndex(Math.min(mediaItems.length - 1, selectedIndex + 1))}
                  disabled={selectedIndex === mediaItems.length - 1}
                  aria-label="Next media"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaGallery;