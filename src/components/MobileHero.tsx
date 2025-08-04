import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface MobileHeroProps {
  featuredArticle?: {
    id: string;
    slug?: string;
    title: string;
    description: string;
    imageUrl: string;
    category: string;
    author: string;
  };
}

const MobileHero = ({ featuredArticle }: MobileHeroProps) => {
  const defaultArticle = {
    id: "1",
    slug: "revolutionary-ai-health-monitor",
    title: "Revolutionary AI-Powered Health Monitor Transforms Personal Healthcare",
    description: "Discover how this innovative startup is making health monitoring accessible to everyone with their groundbreaking wearable technology.",
    imageUrl: "/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png",
    category: "HealthTech",
    author: "Sarah Johnson"
  };

  const article = featuredArticle || defaultArticle;

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${article.imageUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 text-white">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
            <Badge variant="outline" className="border-white/30 text-white">
              {article.category}
            </Badge>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold leading-tight line-clamp-3">
            {article.title}
          </h1>

          <p className="text-white/90 line-clamp-2 text-sm leading-relaxed">
            {article.description}
          </p>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-white/80">
              By {article.author}
            </div>

            <Link to={`/article/${article.slug || article.id}`}>
              <Button 
                size="sm" 
                className="bg-white text-black hover:bg-white/90 transition-all duration-300"
              >
                Read More
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
        <div className="w-1 h-8 bg-white/30 rounded-full animate-pulse" />
      </div>
    </div>
  );
};

export default MobileHero;