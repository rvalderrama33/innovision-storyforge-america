import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  full_name: string;
  product_name: string;
  category: string;
  slug: string;
}

const SearchDialog = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchStories = async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('id, full_name, product_name, category, slug')
          .eq('status', 'approved')
          .or(`full_name.ilike.%${query}%,product_name.ilike.%${query}%,category.ilike.%${query}%`)
          .limit(8);

        if (!error && data) {
          setResults(data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchStories, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Stories</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search by name, product, or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
          />
          
          {isSearching && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">Searching...</div>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((result) => (
                <Link
                  key={result.id}
                  to={`/article/${result.slug || result.id}`}
                  onClick={handleResultClick}
                  className="block p-3 hover:bg-gray-50 rounded-lg border transition-colors"
                >
                  <div className="font-medium text-gray-900">{result.full_name}</div>
                  <div className="text-sm text-gray-600">{result.product_name}</div>
                  <div className="text-xs text-gray-500">{result.category}</div>
                </Link>
              ))}
            </div>
          )}
          
          {query.length >= 2 && results.length === 0 && !isSearching && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">No stories found for "{query}"</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;