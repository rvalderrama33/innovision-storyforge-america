import React from 'react';
import { Share2 } from 'lucide-react';
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  PinterestShareButton,
  EmailShareButton,
  WhatsappShareButton,
  TelegramShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  PinterestIcon,
  EmailIcon,
  WhatsappIcon,
  TelegramIcon
} from 'react-share';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ url, title, description = '', image }) => {
  const shareTitle = title;
  const shareUrl = url;
  const shareImage = image || 'https://americainnovates.us/lovable-uploads/826bf73b-884b-436a-a68b-f1b22cfb5eda.png';

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Share this article</h3>
      </div>
      
      {/* React Share Buttons */}
      <div className="flex gap-2 flex-wrap">
        <FacebookShareButton
          url={shareUrl}
          hashtag="#innovation"
        >
          <FacebookIcon size={32} round />
        </FacebookShareButton>

        <TwitterShareButton
          url={shareUrl}
          title={shareTitle}
          hashtags={['innovation', 'entrepreneurs']}
          via="AmericaInnovates"
        >
          <TwitterIcon size={32} round />
        </TwitterShareButton>

        <LinkedinShareButton
          url={shareUrl}
          title={shareTitle}
          summary={description}
          source="America Innovates Magazine"
        >
          <LinkedinIcon size={32} round />
        </LinkedinShareButton>

        <PinterestShareButton
          url={shareUrl}
          media={shareImage}
          description={shareTitle}
        >
          <PinterestIcon size={32} round />
        </PinterestShareButton>

        <EmailShareButton
          url={shareUrl}
          subject={shareTitle}
          body={`Check out this innovation story: ${shareTitle}`}
        >
          <EmailIcon size={32} round />
        </EmailShareButton>

        <WhatsappShareButton
          url={shareUrl}
          title={shareTitle}
        >
          <WhatsappIcon size={32} round />
        </WhatsappShareButton>

        <TelegramShareButton
          url={shareUrl}
          title={shareTitle}
        >
          <TelegramIcon size={32} round />
        </TelegramShareButton>
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