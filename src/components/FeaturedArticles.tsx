import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import OptimizedImage from "@/components/OptimizedImage";

interface FeaturedStory {
  id: string;
  attribution?: string;
  product_name: string;
  description: string;
  category: string;
  slug: string;
  image_urls: string[];
  generated_article?: string;
}

interface FeaturedArticlesProps {
  onContentLoad?: (hasContent: boolean) => void;
}

const getStoryTeaser = (story: FeaturedStory & { generated_article?: string }) => {
  if (!story.generated_article) return "";
  
  // Get first two lines of the generated article
  const lines = story.generated_article.split('\n').filter(line => line.trim() !== '');
  return lines.slice(0, 2).join(' ').replace(/^#+\s*/, '').trim();
};

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
          .from('published_articles_public')
          .select('*')
          .eq('featured', true)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(16); // Show 16 featured articles

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
                        <OptimizedImage 
                          src={featuredStories[0].image_urls?.[0] || "https://images.unsplash.com/photo-1523362628745-0c100150b504"} 
                          alt={featuredStories[0].product_name || "Featured innovation story"}
                          className="w-full h-96 group-hover:scale-105 transition-transform duration-700"
                          priority={true}
                          lazy={false}
                          width={600}
                          height={300}
                          sizes="(max-width: 1024px) 100vw, 66vw"
                          objectPosition={featuredStories[0].image_urls?.[0]?.includes('0.6836726064516103.jpg') 
                            ? 'center 15%' 
                            : 'center'}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                          <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-4">
                            {featuredStories[0].category || 'Featured Story'}
                          </Badge>
                          <h3 className="text-3xl font-bold mb-3 leading-tight">
                            {featuredStories[0].product_name}
                          </h3>
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
                            <OptimizedImage 
                              src={story.image_urls?.[0] || "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c"} 
                              alt={story.product_name || "Innovation story"}
                              className="w-full h-32 group-hover:scale-105 transition-transform duration-300"
                              lazy={true}
                              width={150}
                              height={100}
                              sizes="(max-width: 1024px) 33vw, 15vw"
                              objectPosition={story.image_urls?.[0]?.includes('0.6836726064516103.jpg') 
                                ? 'center 15%' 
                                : 'center'}
                            />
                          </div>
                          <CardContent className="w-2/3 p-6 flex flex-col justify-center">
                            <Badge variant="secondary" className="mb-2 w-fit text-xs">
                              {story.category || 'Featured'}
                            </Badge>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors leading-tight">
                              {story.product_name}
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
                        <OptimizedImage 
                          src={story.image_urls?.[0] || "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c"} 
                          alt={story.product_name || "Innovation story"}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                          lazy={true}
                          width={300}
                          height={225}
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          objectPosition={story.image_urls?.[0]?.includes('0.6836726064516103.jpg') 
                            ? 'center 15%' 
                            : 'center'}
                        />
                      </div>
                      <CardContent className="p-6">
                        <Badge variant="secondary" className="mb-3 text-xs">
                          {story.category || 'Featured'}
                        </Badge>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors leading-tight">
                          {story.product_name}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
                          {getStoryTeaser(story)}
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