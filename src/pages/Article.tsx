
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Article = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  const fetchArticle = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'approved')
        .single();

      if (error) throw error;
      setArticle(data);
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading article...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <Link to="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link to="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {article.product_name}
          </h1>
          
          <div className="flex items-center text-gray-600 mb-8">
            <span>By {article.full_name}</span>
            <span className="mx-2">•</span>
            <span>{new Date(article.approved_at).toLocaleDateString()}</span>
          </div>
        </div>

        {article.image_urls && article.image_urls.length > 0 && (
          <div className="mb-8">
            <img
              src={article.image_urls[0]}
              alt={article.product_name}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {article.generated_article}
          </div>
        </div>

        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">About the Creator</h3>
          <div className="space-y-2">
            <p><strong>Name:</strong> {article.full_name}</p>
            <p><strong>Location:</strong> {article.city}, {article.state}</p>
            {article.website && (
              <p>
                <strong>Website:</strong>{' '}
                <a
                  href={article.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {article.website}
                </a>
              </p>
            )}
            {article.background && (
              <p><strong>Background:</strong> {article.background}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Article;
