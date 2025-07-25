import React from 'react';
import { Share2, Facebook, Twitter, Linkedin, Mail, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ url, title, description = '', image }) => {
  const { toast } = useToast();

  // Meta tags are now managed globally by the useSEO hook
  // This component only handles the sharing functionality

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${title} - ${description ? description.substring(0, 100) + '...' : 'Read this inspiring innovation story'}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description || '')}`,
    email: `mailto:?subject=${encodeURIComponent(`${title} - America Innovates Magazine`)}&body=${encodeURIComponent(`I thought you'd find this article interesting:\n\n${title}\n\n${description}\n\nRead more: ${url}`)}`
  };

  const handleShare = (platform: string) => {
    if (platform === 'copy') {
      navigator.clipboard.writeText(url).then(() => {
        toast({
          title: "Link copied!",
          description: "Article link has been copied to your clipboard.",
        });
      });
      return;
    }

    const link = shareLinks[platform as keyof typeof shareLinks];
    if (link) {
      window.open(link, '_blank', 'width=600,height=400');
    }
  };

  const debugSocialSharing = () => {
    console.log('Social sharing debug info:', {
      title,
      description,
      url,
      image,
      currentMetaTags: {
        ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'),
      }
    });
    
    toast({
      title: "Debug info logged",
      description: "Check browser console for social sharing debug information.",
    });
  };

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Share this article</h3>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('facebook')}
          className="flex items-center gap-2"
        >
          <Facebook className="h-4 w-4" />
          Facebook
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('twitter')}
          className="flex items-center gap-2"
        >
          <Twitter className="h-4 w-4" />
          Twitter
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('linkedin')}
          className="flex items-center gap-2"
        >
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('email')}
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Email
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleShare('copy')}
          className="flex items-center gap-2"
        >
          <Link2 className="h-4 w-4" />
          Copy Link
        </Button>
      </div>
      
      {/* Debug section - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Debug Tools:</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={debugSocialSharing}
              className="text-xs"
            >
              Debug Meta Tags
            </Button>
            <a
              href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Facebook Debugger
            </a>
            <a
              href={`https://cards-dev.twitter.com/validator`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Twitter Validator
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialShare;