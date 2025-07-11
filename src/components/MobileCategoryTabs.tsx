import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface Category {
  id: string;
  name: string;
  count: number;
}

interface MobileCategoryTabsProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const MobileCategoryTabs = ({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: MobileCategoryTabsProps) => {
  const [showAll, setShowAll] = useState(false);

  const allCategories = [
    { id: 'all', name: 'All', count: categories.reduce((sum, cat) => sum + cat.count, 0) },
    ...categories
  ];

  const visibleCategories = showAll ? allCategories : allCategories.slice(0, 6);

  return (
    <div className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-10">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">Categories</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="text-xs"
          >
            <Filter className="w-3 h-3 mr-1" />
            {showAll ? 'Show Less' : 'Show All'}
          </Button>
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {visibleCategories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "secondary"}
                className={`cursor-pointer whitespace-nowrap transition-all duration-200 hover:scale-105 ${
                  selectedCategory === category.id 
                    ? 'shadow-sm' 
                    : 'hover:bg-muted-foreground/20'
                }`}
                onClick={() => onCategoryChange(category.id)}
              >
                {category.name}
                <span className="ml-1 text-xs opacity-70">
                  {category.count}
                </span>
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default MobileCategoryTabs;