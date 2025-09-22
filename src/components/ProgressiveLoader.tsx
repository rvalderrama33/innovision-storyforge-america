import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  initialItems?: number;
  loadMoreItems?: number;
  totalItems: number;
  className?: string;
}

const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  children,
  initialItems = 4,
  loadMoreItems = 4,
  totalItems,
  className = ''
}) => {
  const [visibleItems, setVisibleItems] = useState(initialItems);
  const [isLoading, setIsLoading] = useState(false);

  const childrenArray = React.Children.toArray(children);
  const hasMore = visibleItems < totalItems;

  const loadMore = async () => {
    setIsLoading(true);
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setVisibleItems(prev => Math.min(prev + loadMoreItems, totalItems));
    setIsLoading(false);
  };

  return (
    <div className={className}>
      {childrenArray.slice(0, visibleItems)}
      
      {hasMore && (
        <div className="text-center mt-12">
          <Button 
            onClick={loadMore}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="px-8 py-3"
          >
            {isLoading ? 'Loading...' : `Load More Stories (${totalItems - visibleItems} remaining)`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProgressiveLoader;