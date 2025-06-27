
import Hero from "@/components/Hero";
import FeaturedArticles from "@/components/FeaturedArticles";
import CategoryGrid from "@/components/CategoryGrid";
import Newsletter from "@/components/Newsletter";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Hero />
      <FeaturedArticles />
      <CategoryGrid />
      <Newsletter />
    </div>
  );
};

export default Index;
