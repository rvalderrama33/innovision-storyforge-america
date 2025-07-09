import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SitemapRoute = () => {
  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('sitemap');
        
        if (error) {
          console.error('Error fetching sitemap:', error);
          return;
        }
        
        // Redirect to the actual sitemap XML
        window.location.href = `https://c87a1b82-b6a6-4aa2-ad6a-ba5512d06ce3.supabase.co/functions/v1/sitemap`;
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchSitemap();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Generating Sitemap...</h1>
        <p className="text-gray-600">Please wait while we redirect you to the sitemap.</p>
      </div>
    </div>
  );
};

export default SitemapRoute;