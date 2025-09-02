import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: object;
  canonical?: string;
  robots?: string;
}

export const useSEO = ({ 
  title, 
  description, 
  url, 
  image, 
  type = "website", 
  author,
  publishedTime,
  modifiedTime,
  structuredData,
  canonical,
  robots = "index, follow"
}: SEOProps) => {
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
        'meta[property="fb:app_id"]',
        'meta[name="robots"]',
        'meta[name="author"]',
        'link[rel="canonical"]',
        'script[type="application/ld+json"]'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => element.remove());
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
    createMetaTag("robots", robots);
    
    // Author meta tag
    if (author) {
      createMetaTag("author", author);
    }
    
    // Canonical URL
    if (canonical || url) {
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", canonical || url);
      document.head.appendChild(link);
      console.log(`Created canonical link: ${canonical || url}`);
    }

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
    
    // Article-specific Open Graph tags
    if (type === "article") {
      if (author) {
        createMetaTag("article:author", author, true);
      }
      if (publishedTime) {
        createMetaTag("article:published_time", publishedTime, true);
      }
      if (modifiedTime) {
        createMetaTag("article:modified_time", modifiedTime, true);
      }
    }

    // Twitter Card tags
    createMetaTag("twitter:card", "summary_large_image");
    createMetaTag("twitter:title", title);
    createMetaTag("twitter:description", description);
    createMetaTag("twitter:image", imageToUse);
    createMetaTag("twitter:site", "@AmericaInnovate");
    
    // LinkedIn specific tags
    createMetaTag("linkedin:owner", "America Innovates Magazine");
    
    // Structured Data (JSON-LD)
    if (structuredData) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
      console.log("Created structured data:", structuredData);
    }

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