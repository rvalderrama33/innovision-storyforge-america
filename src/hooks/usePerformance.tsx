import { useEffect } from 'react';

interface PreloadResource {
  href: string;
  as: 'image' | 'font' | 'script' | 'style';
  type?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
}

export const usePreloadResources = (resources: PreloadResource[]) => {
  useEffect(() => {
    const links: HTMLLinkElement[] = [];

    resources.forEach(resource => {
      // Check if already preloaded
      const existing = document.querySelector(`link[href="${resource.href}"]`);
      if (existing) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      
      if (resource.type) {
        link.type = resource.type;
      }
      
      if (resource.crossorigin) {
        link.crossOrigin = resource.crossorigin;
      }

      document.head.appendChild(link);
      links.push(link);
    });

    // Cleanup
    return () => {
      links.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [resources]);
};

// Preload critical images for better LCP
export const useCriticalImagePreload = (imageUrls: string[]) => {
  const resources: PreloadResource[] = imageUrls.map(url => ({
    href: url,
    as: 'image',
    crossorigin: 'anonymous'
  }));

  usePreloadResources(resources);
};

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // Log performance metrics (you can send to analytics)
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('Navigation timing:', {
            loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
          });
        }
        
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
        
        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] });
    } catch (e) {
      // Browser doesn't support some metrics
    }

    return () => observer.disconnect();
  }, []);
};

// Resource hints for external domains
export const useResourceHints = () => {
  useEffect(() => {
    const hints = [
      { rel: 'dns-prefetch', href: '//images.unsplash.com' },
      { rel: 'preconnect', href: 'https://images.unsplash.com' },
      { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' }
    ];

    const linkElements: HTMLLinkElement[] = [];

    hints.forEach(hint => {
      const existing = document.querySelector(`link[href="${hint.href}"]`);
      if (existing) return;

      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.crossorigin) {
        link.crossOrigin = hint.crossorigin;
      }

      document.head.appendChild(link);
      linkElements.push(link);
    });

    return () => {
      linkElements.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, []);
};