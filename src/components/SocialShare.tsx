import React, { useEffect } from 'react';
import { Share2 } from 'lucide-react';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ url, title, description = '', image }) => {
  useEffect(() => {
    // Load AddToAny script if not already loaded
    if (!document.querySelector('script[src*="addtoany"]')) {
      const script = document.createElement('script');
      script.src = 'https://static.addtoany.com/menu/page.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Share this article</h3>
      </div>
      
      {/* AddToAny Share Buttons */}
      <div className="a2a_kit a2a_kit_size_32 a2a_default_style" 
           data-a2a-url={url} 
           data-a2a-title={title}>
        <a className="a2a_button_facebook"></a>
        <a className="a2a_button_twitter"></a>
        <a className="a2a_button_linkedin"></a>
        <a className="a2a_button_email"></a>
        <a className="a2a_button_whatsapp"></a>
        <a className="a2a_button_telegram"></a>
        <a className="a2a_button_copy_link"></a>
        <a className="a2a_dd" href="https://www.addtoany.com/share"></a>
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