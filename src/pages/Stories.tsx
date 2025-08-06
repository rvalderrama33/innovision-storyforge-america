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
  full_name: string;
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
  // Create engaging teasers for specific stories
  const teasers: Record<string, string> = {
    "Aaron Krause": "Aaron Krause turned a simple sponge into the Scrub Daddy phenomenon—on Shark Tank and beyond. What started as a car detailing tool became one of the most successful products in the show's history.",
    "Michael Jon Smith": "From corporate executive to innovative entrepreneur, Michael Jon Smith's journey proves that the best ideas often come from solving your own everyday problems. His breakthrough product is reshaping how we think about modern convenience.",
    "Ronald Droze": "Sometimes the most revolutionary ideas hide in plain sight. Ronald Droze's ingenious approach to solving a common household frustration has created a product that millions now consider essential.",
    "William Kessel": "What happens when engineering expertise meets everyday annoyance? William Kessel's story shows how technical knowledge combined with entrepreneurial spirit can turn a simple observation into a game-changing innovation.",
    "Lakesha Bowden": "Lakesha Bowden's path to innovation demonstrates that the most impactful products often solve problems we didn't even realize we had. Her creation is changing how people approach their daily routines."
  };

  return teasers[story.full_name] || story.description || "Discover how this innovative entrepreneur turned a simple idea into a breakthrough product that's making everyday life better for thousands of people.";
};

const Stories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Innovation Stories | America Innovates Magazine",
    description: "Discover inspiring stories from entrepreneurs and creators building breakthrough consumer products. Read about innovations that are making everyday life better.",
    url: "https://americainnovates.us/stories"
  });

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
                // Use headshot image for Michael Jon Smith, otherwise use first image
                const imageUrl = story.full_name === "Michael Jon Smith" && story.headshot_image 
                  ? story.headshot_image 
                  : story.image_urls?.[0];
                
                return (
                  <Link key={story.id} to={`/article/${story.slug || story.id}`}>
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-200 h-full">
                      <div className="aspect-[4/3] relative overflow-hidden">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={story.product_name || 'Innovation story'}
                            className={`w-full h-full object-cover ${
                              story.full_name === "Ronald Droze" || 
                              story.full_name === "William Kessel" || 
                              story.full_name === "Lakesha Bowden" ||
                              story.product_name === "Beeryards" 
                                ? "object-center" : story.full_name === "David Harrington" 
                                ? "object-top" : "object-top"
                            } group-hover:scale-105 transition-transform duration-300`}
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