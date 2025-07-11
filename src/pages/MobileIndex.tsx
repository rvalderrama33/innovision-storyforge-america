import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MobileHero from "@/components/MobileHero";
import MobileArticleCard from "@/components/MobileArticleCard";
import MobileCategoryTabs from "@/components/MobileCategoryTabs";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const MobileIndex = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch published submissions (articles)
  const { data: articles, isLoading, refetch } = useQuery({
    queryKey: ['mobile-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('status', 'approved')
        .not('generated_article', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  // Get categories with counts
  const categories = [
    { id: 'tech', name: 'Technology', count: 15 },
    { id: 'health', name: 'Health', count: 8 },
    { id: 'finance', name: 'Finance', count: 12 },
    { id: 'education', name: 'Education', count: 6 },
    { id: 'lifestyle', name: 'Lifestyle', count: 10 },
    { id: 'business', name: 'Business', count: 18 },
  ];

  // Filter articles by category
  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles?.filter(article => 
        article.category?.toLowerCase() === selectedCategory.toLowerCase()
      );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Featured article (first article or default)
  const featuredArticle = articles?.[0] ? {
    id: articles[0].slug || articles[0].id,
    title: articles[0].product_name || "Featured Innovation",
    description: articles[0].description || "Discover the latest innovation story",
    imageUrl: articles[0].image_urls?.[0] || "/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png",
    category: articles[0].category || "Innovation",
    author: articles[0].full_name || "America Innovates"
  } : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Hero Section */}
      <MobileHero featuredArticle={featuredArticle} />

      {/* Category Tabs */}
      <MobileCategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Articles Grid */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {selectedCategory === 'all' ? 'Latest Stories' : `${selectedCategory} Stories`}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-muted-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredArticles?.map((article) => (
              <MobileArticleCard
                key={article.id}
                id={article.slug || article.id}
                title={article.product_name || "Innovation Story"}
                description={article.description || "Discover this amazing innovation"}
                category={article.category || "Innovation"}
                imageUrl={article.image_urls?.[0]}
                author={article.full_name || "America Innovates"}
                publishedAt={article.created_at}
                featured={article.featured}
              />
            ))}
          </div>
        )}

        {filteredArticles?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No stories found
            </h3>
            <p className="text-sm text-muted-foreground">
              Try selecting a different category or check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileIndex;