import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Users } from "lucide-react";
import { Link } from "react-router-dom";

interface TrendingItem {
  id: string;
  title: string;
  category: string;
  views: number;
  timeAgo: string;
  trending: boolean;
}

const TrendingSidebar = () => {
  // Mock trending data - would come from API in real implementation
  const trendingStories: TrendingItem[] = [
    {
      id: "1",
      title: "Revolutionary AI Startup Transforms Healthcare",
      category: "Technology",
      views: 12453,
      timeAgo: "2h ago",
      trending: true
    },
    {
      id: "2", 
      title: "Green Energy Innovation Wins Major Award",
      category: "Sustainability",
      views: 8921,
      timeAgo: "4h ago",
      trending: true
    },
    {
      id: "3",
      title: "Young Entrepreneur Disrupts Food Industry",
      category: "Business",
      views: 7834,
      timeAgo: "6h ago",
      trending: false
    },
    {
      id: "4",
      title: "Tech Giant Announces Major Partnership",
      category: "Technology", 
      views: 6542,
      timeAgo: "8h ago",
      trending: false
    },
    {
      id: "5",
      title: "Innovative Manufacturing Process Breakthrough",
      category: "Manufacturing",
      views: 5123,
      timeAgo: "12h ago",
      trending: false
    }
  ];

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}k`;
    }
    return views.toString();
  };

  return (
    <aside className="w-80 p-6 border-l border-border bg-card/50">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Stories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trendingStories.map((story, index) => (
            <div
              key={story.id}
              className="group cursor-pointer p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Link to={`/article/${story.id}`} className="block">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{index + 1}
                    </span>
                    {story.trending && (
                      <Badge variant="secondary" className="h-5 text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Hot
                      </Badge>
                    )}
                  </div>
                </div>
                
                <h4 className="text-sm font-medium leading-tight mb-2 group-hover:text-primary transition-colors">
                  {story.title}
                </h4>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-5 text-xs">
                      {story.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatViews(story.views)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {story.timeAgo}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Additional trending content sections could go here */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Popular Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["Technology", "Healthcare", "Sustainability", "Business", "Manufacturing", "AI/ML"].map((category) => (
              <Badge 
                key={category} 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
};

export default TrendingSidebar;