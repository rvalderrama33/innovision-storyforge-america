
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedStory {
  id: string;
  full_name: string;
  product_name: string;
  description: string;
  category: string;
  slug: string;
  image_urls: string[];
}

interface FeaturedArticlesProps {
  onContentLoad?: (hasContent: boolean) => void;
}

const FeaturedArticles = ({ onContentLoad }: FeaturedArticlesProps) => {
  const [featuredStories, setFeaturedStories] = useState<FeaturedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize shuffle function to avoid recreating it on every render
  const shuffleArray = useMemo(() => (array: FeaturedStory[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  useEffect(() => {
    const fetchFeaturedStories = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('status', 'approved')
          .eq('featured', true)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(28);

        if (error) {
          console.error('Error fetching featured stories:', error);
          onContentLoad?.(false);
        } else {
          const shuffledStories = shuffleArray(data || []);
          setFeaturedStories(shuffledStories);
          onContentLoad?.(shuffledStories.length > 0);
        }
      } catch (error) {
        console.error('Failed to fetch stories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedStories();
  }, [shuffleArray]);

  return (
    <section className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Featured Stories
          </h2>
          <div className="w-24 h-1 bg-gray-900 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Dive into the latest consumer product innovations and meet the brilliant minds behind tomorrow's must-have items.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : featuredStories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No featured stories available yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
              {/* Featured Article */}
              {featuredStories[0] && (
                <div className="lg:col-span-8">
                  <Link to={`/article/${featuredStories[0].slug || featuredStories[0].id}`}>
                    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group cursor-pointer border-0 shadow-lg">
                      <div className="relative">
                        <img 
                          src={featuredStories[0].image_urls?.[0] || "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&h=400&fit=crop"} 
                          alt={featuredStories[0].product_name || "Featured innovation story"}
                          className={`w-full h-96 object-cover group-hover:scale-105 transition-transform duration-700 ${
                            featuredStories[0].full_name === "Ronald Droze" || 
                            featuredStories[0].full_name === "William Kessel" || 
                            featuredStories[0].full_name === "Lakesha Bowden" ||
                            featuredStories[0].full_name === "David Harrington" ||
                            featuredStories[0].product_name === "Beeryards" 
                              ? "object-center" : "object-top"
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                          <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-4">
                            {featuredStories[0].category || 'Featured Story'}
                          </Badge>
                          <h3 className="text-3xl font-bold mb-3 leading-tight">
                            {featuredStories[0].full_name}
                          </h3>
                          <p className="text-white/90 text-lg leading-relaxed">
                            {featuredStories[0].description}
                          </p>
                          <p className="text-white/75 text-sm mt-2">
                            by America Innovates Magazine
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>
              )}

              {/* Side Articles (up to 3) */}
              {featuredStories.length > 1 && (
                <div className="lg:col-span-4 space-y-6">
                  {featuredStories.slice(1, 4).map((story) => (
                    <Link key={story.id} to={`/article/${story.slug || story.id}`}>
                      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-200">
                        <div className="flex">
                          <div className="w-1/3">
                            <img 
                              src={story.image_urls?.[0] || "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop"} 
                              alt={story.product_name || "Innovation story"}
                              className={`w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300 ${
                                story.full_name === "Ronald Droze" || 
                                story.full_name === "William Kessel" || 
                                story.full_name === "Lakesha Bowden" ||
                                story.full_name === "David Harrington" ||
                                story.product_name === "Beeryards" 
                                  ? "object-center" : "object-top"
                              }`}
                            />
                          </div>
                          <CardContent className="w-2/3 p-6 flex flex-col justify-center">
                            <Badge variant="secondary" className="mb-2 w-fit text-xs">
                              {story.category || 'Featured'}
                            </Badge>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors leading-tight">
                              {story.full_name}
                            </h3>
                            <span className="text-sm text-gray-500">by America Innovates Magazine</span>
                          </CardContent>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Featured Articles Grid */}
            {featuredStories.length > 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredStories.slice(4).map((story) => (
                  <Link key={story.id} to={`/article/${story.slug || story.id}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-200 h-full">
                      <div className="aspect-[4/3] relative overflow-hidden">
                        <img 
                          src={story.image_urls?.[0] || "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop"} 
                          alt={story.product_name || "Innovation story"}
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                            story.full_name === "Ronald Droze" || 
                            story.full_name === "William Kessel" || 
                            story.full_name === "Lakesha Bowden" ||
                            story.full_name === "David Harrington" ||
                            story.product_name === "Beeryards" 
                              ? "object-center" : "object-top"
                          }`}
                        />
                      </div>
                      <CardContent className="p-6">
                        <Badge variant="secondary" className="mb-3 text-xs">
                          {story.category || 'Featured'}
                        </Badge>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors leading-tight">
                          {story.full_name}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
                          {story.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          by America Innovates Magazine
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedArticles;
