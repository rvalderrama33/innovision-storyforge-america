
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedArticles from "@/components/FeaturedArticles";
import Newsletter from "@/components/Newsletter";
import { useSEO } from "@/hooks/useSEO";
import { useState } from "react";

const Index = () => {
  const [hasContent, setHasContent] = useState(false);

  // Structured data for homepage
  const homepageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "America Innovates Magazine - Home",
    "description": "Discover breakthrough consumer products from visionary entrepreneurs and creators",
    "url": "https://americainnovates.us",
    "mainEntity": {
      "@type": "Organization",
      "name": "America Innovates Magazine",
      "description": "Spotlighting entrepreneurs and creators building breakthrough consumer products",
      "foundingDate": "2024",
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "stories@americainnovates.us",
        "contactType": "Editorial"
      }
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://americainnovates.us"
        }
      ]
    }
  };

  useSEO({
    title: "America Innovates Magazine | Spotlighting Entrepreneurs & Creators",
    description: "Discover breakthrough consumer products from visionary entrepreneurs and creators who are building innovations that make everyday life better. Share your innovation story today.",
    url: "https://americainnovates.us",
    canonical: "https://americainnovates.us",
    image: "https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png",
    structuredData: homepageStructuredData
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <FeaturedArticles onContentLoad={setHasContent} />
      
      {/* Only show AdSense when there's substantial content */}
      {hasContent && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <ins className="adsbygoogle"
               style={{display:'block'}}
               data-ad-client="ca-pub-3665365079867533"
               data-ad-slot="5115934537"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          <script dangerouslySetInnerHTML={{
            __html: `(adsbygoogle = window.adsbygoogle || []).push({});`
          }} />
        </div>
      )}
      
      
      {/* Marketplace Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">America Innovates Marketplace</h2>
          <p className="text-lg text-gray-600 mb-8">
            Supporting American entrepreneurs and creators through our multi-vendor e-commerce platform
          </p>
          <Link 
            to="/marketplace-info" 
            className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Explore Marketplace
          </Link>
        </div>
      </section>

      <Newsletter />
    </div>
  );
};

export default Index;
