import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface SearchResult {
  id: string;
  full_name: string;
  product_name: string;
  description: string;
  category: string;
  slug: string;
  image_urls: string[];
  created_at: string;
  generated_article: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchStories = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('status', 'approved')
        .or(
          `full_name.ilike.%${searchQuery}%,` +
          `product_name.ilike.%${searchQuery}%,` +
          `description.ilike.%${searchQuery}%,` +
          `category.ilike.%${searchQuery}%,` +
          `generated_article.ilike.%${searchQuery}%`
        )
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchStories(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = () => {
    onOpenChange(false);
    setQuery("");
    setResults([]);
    setHasSearched(false);
  };

  const getStoryPreview = (story: SearchResult) => {
    if (story.generated_article) {
      const lines = story.generated_article.split('\n').filter(line => line.trim() !== '');
      return lines.slice(0, 2).join(' ').replace(/^#+\s*/, '').trim();
    }
    return story.description || "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Innovation Stories
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by entrepreneur, product, or topic..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Searching...</span>
            </div>
          ) : hasSearched && results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">No results found</p>
              <p className="text-sm">Try searching for different keywords</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3 py-2">
              {results.map((story) => (
                <Link
                  key={story.id}
                  to={`/article/${story.slug || story.id}`}
                  onClick={handleResultClick}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {story.image_urls?.[0] && (
                          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={story.image_urls[0]}
                              alt={story.product_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-foreground line-clamp-1">
                              {story.generated_article 
                                ? story.generated_article.split('\n')[0].replace(/^#+\s*/, '').trim() 
                                : story.product_name
                              }
                            </h3>
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {story.category || 'Innovation'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {getStoryPreview(story)}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{story.full_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(story.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : !hasSearched ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">Search Innovation Stories</p>
              <p className="text-sm">Find stories by entrepreneur name, product, or topic</p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;