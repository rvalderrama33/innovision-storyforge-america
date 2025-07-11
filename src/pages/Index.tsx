
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedArticles from "@/components/FeaturedArticles";
import Newsletter from "@/components/Newsletter";
import { useSEO } from "@/hooks/useSEO";

const Index = () => {
  useSEO({
    title: "America Innovates Magazine | Spotlighting Entrepreneurs & Creators",
    description: "Discover breakthrough consumer products from visionary entrepreneurs and creators who are building innovations that make everyday life better. Share your innovation story today.",
    url: "https://americainnovates.us",
    image: "https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png"
  });
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <FeaturedArticles />
      <Newsletter />
    </div>
  );
};

export default Index;
