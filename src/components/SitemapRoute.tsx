import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SitemapRoute = () => {
  const [sitemap, setSitemap] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('sitemap');
        
        if (error) {
          console.error('Error fetching sitemap:', error);
          setLoading(false);
          return;
        }
        
        // Replace the page content with XML
        document.open();
        document.write(data);
        document.close();
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Generating Sitemap...</h1>
          <p className="text-gray-600">Please wait while we generate your sitemap.</p>
        </div>
      </div>
    );
  }

  return null;
};

export default SitemapRoute;