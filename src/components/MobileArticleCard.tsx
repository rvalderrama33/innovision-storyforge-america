import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import { Link } from "react-router-dom";

interface MobileArticleCardProps {
  id: string;
  slug?: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  author: string;
  publishedAt: string;
  readTime?: number;
  featured?: boolean;
}

const MobileArticleCard = ({ 
  id, 
  slug,
  title, 
  description, 
  category, 
  imageUrl, 
  author, 
  publishedAt, 
  readTime = 5,
  featured = false 
}: MobileArticleCardProps) => {
  return (
    <Link to={`/article/${slug || id}`} className="block">
      <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.98] ${
        featured ? 'border-primary shadow-md' : ''
      }`}>
        {imageUrl && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {featured && (
              <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                Featured
              </Badge>
            )}
            <Badge variant="secondary" className="absolute top-3 right-3">
              {category}
            </Badge>
          </div>
        )}
        
        <div className="p-4 space-y-3">
          <h3 className="text-lg font-semibold line-clamp-2 leading-tight">
            {title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{author}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(publishedAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{readTime} min</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default MobileArticleCard;