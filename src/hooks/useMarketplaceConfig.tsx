import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useMarketplaceConfig = () => {
  const [isMarketplaceLive, setIsMarketplaceLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('site_config')
          .select('value')
          .eq('key', 'marketplace_live')
          .maybeSingle();

        if (error) {
          console.error('Error fetching marketplace config:', error);
          setIsMarketplaceLive(false);
        } else {
          setIsMarketplaceLive(data?.value || false);
        }
      } catch (error) {
        console.error('Error fetching marketplace config:', error);
        setIsMarketplaceLive(false);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return { isMarketplaceLive, loading };
};