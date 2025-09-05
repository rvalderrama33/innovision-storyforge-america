import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { useSEO } from "@/hooks/useSEO";

interface Story {
  id: string;
  attribution?: string;
  product_name: string;
  description: string;
  category: string;
  slug: string;
  image_urls: string[];
  created_at: string;
  featured: boolean;
  generated_article: string;
  headshot_image?: string;
}

const getStoryTeaser = (story: Story) => {
  if (!story.generated_article) return "";
  
  // Get first two lines of the generated article
  const lines = story.generated_article.split('\n').filter(line => line.trim() !== '');
  return lines.slice(0, 2).join(' ').replace(/^#+\s*/, '').trim();
};

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  // Structured data for Stories page
  const storiesStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Innovation Stories",
    "description": "Discover inspiring stories from entrepreneurs and creators building breakthrough consumer products",
    "url": "https://americainnovates.us/stories",
    "publisher": {
      "@type": "Organization",
      "name": "America Innovates Magazine",
      "logo": {
        "@type": "ImageObject", 
        "url": "https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png"
      }
    }
  };

  useSEO({
    title: "Innovation Stories | America Innovates Magazine",
    description: "Discover inspiring stories from entrepreneurs and creators building breakthrough consumer products. Read about innovations that are making everyday life better.",
    url: "https://americainnovates.us/stories",
    canonical: "https://americainnovates.us/stories",
    structuredData: storiesStructuredData
  });

  useEffect(() => {
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from('published_articles_public')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stories:', error);
      } else {
        setStories(data || []);
      }
      setLoading(false);
    };

    fetchStories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Header */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Innovation Stories
          </h1>
          <div className="max-w-4xl">
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Each month we bring you the behind-the-scenes stories of everyday product innovators who dared to dream differently. These aren't just tales of overnight success—they're chronicles of persistence, creativity, and the relentless pursuit of solutions to real-world problems. From kitchen inventors to garage tinkerers, from corporate refugees to college dropouts, these entrepreneurs share one common trait: they saw a need and refused to accept "that's just how it's done."
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              In these pages, you'll discover how ordinary people transformed simple ideas into extraordinary products that millions now use daily. Learn from their mistakes, celebrate their victories, and perhaps find the inspiration to turn your own spark of innovation into the next breakthrough that changes the world.
            </p>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {stories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No stories available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stories.map((story) => {
                // Use headshot image, first image, or default banner
                const imageUrl = story.headshot_image || story.image_urls?.[0] || 'https://enckzbxifdrihnfcqagb.supabase.co/storage/v1/object/public/submission-images/0.8121512358682939.png';
                
                return (
                  <Link key={story.id} to={`/article/${story.slug || story.id}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-200 h-full">
                      <div className="aspect-[16/15] relative overflow-hidden">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={story.product_name || 'Innovation story'}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                              story.slug === 'a-slice-of-innovation-how-a-family-tradition-sparked-a-culinary-revolution' 
                                ? 'object-top' 
                                : 'object-center'
                            }`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                        {story.featured && (
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-yellow-500 text-white">Featured</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-6">
                        <div className="mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {story.category || 'Innovation'}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
                          {story.generated_article ? story.generated_article.split('\n')[0].replace(/^#+\s*/, '').trim() : (story.product_name || 'Untitled Product')}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-3">
                          {getStoryTeaser(story)}
                        </p>
                        <p className="text-sm text-gray-500">
                          by America Innovates Magazine
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stories;