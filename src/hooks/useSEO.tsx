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
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Update document title
      document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement("meta");
        if (property) {
          meta.setAttribute("property", name);
        } else {
          meta.setAttribute("name", name);
        }
        document.head.appendChild(meta);
        console.log(`Created new meta tag: ${property ? 'property' : 'name'}="${name}" content="${content}"`);
      } else {
        console.log(`Updated existing meta tag: ${property ? 'property' : 'name'}="${name}" content="${content}"`);
      }
      meta.content = content;
    };

    // Basic meta tags
    updateMetaTag("description", description);
    updateMetaTag("robots", "index, follow");

    // Open Graph tags
    updateMetaTag("og:title", title, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("fb:app_id", "1234567890", true); // Facebook App ID
    
    if (url) {
      updateMetaTag("og:url", url, true);
    }
    
    // Always set an image - use provided image or fallback to logo
    const fallbackImage = "https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png";
    const imageToUse = image || fallbackImage;
    console.log('useSEO - Image provided:', image);
    console.log('useSEO - Image to use:', imageToUse);
    updateMetaTag("og:image", imageToUse, true);
    updateMetaTag("og:image:width", "1200", true);
    updateMetaTag("og:image:height", "630", true);

    // Twitter tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", title);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", imageToUse);

    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
      // Reset to default title on unmount
      document.title = "America Innovates Magazine | Spotlighting Entrepreneurs & Creators";
    };
  }, [title, description, url, image, type]);
};