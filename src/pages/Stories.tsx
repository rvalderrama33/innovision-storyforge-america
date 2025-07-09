import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";

interface Story {
  id: string;
  full_name: string;
  product_name: string;
  description: string;
  category: string;
  slug: string;
  image_urls: string[];
  created_at: string;
  featured: boolean;
}

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('status', 'approved')
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
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Innovation Stories
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Discover the latest breakthrough consumer products from visionary entrepreneurs and creators.
          </p>
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
                const imageUrl = story.image_urls?.[0];
                
                return (
                  <Link key={story.id} to={`/article/${story.slug}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-200 h-full">
                      <div className="aspect-[4/3] relative overflow-hidden">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={story.full_name || 'Story author'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                          {story.product_name || 'Untitled Product'}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {story.description}
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