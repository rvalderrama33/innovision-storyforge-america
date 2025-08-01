import React from 'react';
import { Share2, Facebook, Twitter, Linkedin, Mail, MessageCircle, Send } from 'lucide-react';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ url, title, description = '', image }) => {
  const shareTitle = encodeURIComponent(title);
  const shareUrl = encodeURIComponent(url);
  const shareImage = image || 'https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png';
  const shareDescription = encodeURIComponent(description);

  const shareButtons = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}&via=AmericaInnovates`,
      color: 'bg-sky-500 hover:bg-sky-600'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      color: 'bg-blue-700 hover:bg-blue-800'
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${shareTitle}&body=Check out this innovation story: ${shareTitle} - ${shareUrl}`,
      color: 'bg-gray-600 hover:bg-gray-700'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${shareTitle} - ${shareUrl}`,
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      name: 'Telegram',
      icon: Send,
      url: `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`,
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ];

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Share this article</h3>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {shareButtons.map((button) => {
          const IconComponent = button.icon;
          return (
            <a
              key={button.name}
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${button.color} text-white p-2 rounded-full transition-colors duration-200 flex items-center justify-center w-10 h-10`}
              title={`Share on ${button.name}`}
            >
              <IconComponent className="h-5 w-5" />
            </a>
          );
        })}
      </div>
      
      {/* Debug section - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Debug Tools:</p>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Facebook Debugger
            </a>
            <a
              href={`https://cards-dev.twitter.com/validator`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Twitter Validator
            </a>
            <a
              href={`https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              LinkedIn Inspector
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialShare;