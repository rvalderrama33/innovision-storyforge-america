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
        
        setSitemap(data);
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  useEffect(() => {
    if (sitemap) {
      // Set the content type to XML and serve the sitemap
      const blob = new Blob([sitemap], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      window.location.replace(url);
    }
  }, [sitemap]);

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

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Sitemap Error</h1>
        <p className="text-gray-600">There was an error generating the sitemap.</p>
      </div>
    </div>
  );
};

export default SitemapRoute;