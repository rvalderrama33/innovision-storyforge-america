import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: string;
}

export const useSEO = ({ title, description, url, image, type = "website" }: SEOProps) => {
  useEffect(() => {
    console.log('useSEO hook running with:', { title, description, url, image, type });
    
    // Update document title
    document.title = title;

    // More aggressive meta tag replacement - remove and recreate to ensure freshness
    const removeExistingMetaTags = () => {
      const selectors = [
        'meta[name="description"]',
        'meta[property^="og:"]',
        'meta[name^="twitter:"]',
        'meta[property="fb:app_id"]'
      ];
      
      selectors.forEach(selector => {
        const metas = document.querySelectorAll(selector);
        metas.forEach(meta => meta.remove());
      });
    };

    // Create meta tag with proper attributes
    const createMetaTag = (identifier: string, content: string, useProperty = false) => {
      const meta = document.createElement("meta");
      const attribute = useProperty ? "property" : "name";
      meta.setAttribute(attribute, identifier);
      meta.setAttribute('content', content);
      document.head.appendChild(meta);
      console.log(`Created meta tag: ${attribute}="${identifier}" content="${content.substring(0, 50)}..."`);
    };

    // Remove existing meta tags first
    removeExistingMetaTags();

    // Always set an image - use provided image or fallback to logo
    const fallbackImage = "https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png";
    const imageToUse = image || fallbackImage;
    console.log('useSEO - Image provided:', image);
    console.log('useSEO - Image to use:', imageToUse);

    // Basic meta tags
    createMetaTag("description", description);
    createMetaTag("robots", "index, follow");

    // Open Graph tags
    createMetaTag("og:title", title, true);
    createMetaTag("og:description", description, true);
    createMetaTag("og:type", type, true);
    createMetaTag("og:site_name", "America Innovates Magazine", true);
    createMetaTag("og:image", imageToUse, true);
    createMetaTag("og:image:width", "1200", true);
    createMetaTag("og:image:height", "630", true);
    createMetaTag("og:image:type", "image/jpeg", true);
    createMetaTag("og:image:alt", title, true);
    
    if (url) {
      createMetaTag("og:url", url, true);
    }

    // Twitter Card tags
    createMetaTag("twitter:card", "summary_large_image");
    createMetaTag("twitter:title", title);
    createMetaTag("twitter:description", description);
    createMetaTag("twitter:image", imageToUse);
    createMetaTag("twitter:site", "@AmericaInnovate");

    // Log final meta tags for debugging
    setTimeout(() => {
      const finalImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
      const finalTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
      console.log('Final meta tags set:', {
        ogImage: finalImage,
        ogTitle: finalTitle,
        twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')
      });
    }, 100);

    return () => {
      // Reset to default title on unmount
      document.title = "America Innovates Magazine | Spotlighting Entrepreneurs & Creators";
    };
  }, [title, description, url, image, type]);
};