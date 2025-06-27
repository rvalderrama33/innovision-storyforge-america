
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FeaturedArticles = () => {
  const articles = [
    {
      id: 1,
      title: "The Smart Water Bottle That's Revolutionizing Hydration",
      excerpt: "Meet Lisa Park, whose AI-powered hydration tracker has sold over 2 million units and is helping people live healthier lives.",
      category: "Spotlight Profile",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&h=400&fit=crop",
      featured: true
    },
    {
      id: 2,
      title: "The 19-Year-Old Who Created the Perfect Phone Stand",
      excerpt: "College student Jake Rodriguez turned a dorm room idea into a $5M business with his ergonomic phone accessory.",
      category: "Emerging Innovators",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop"
    },
    {
      id: 3,
      title: "Inside Dyson's Secret Home Innovation Lab",
      excerpt: "Exclusive access to the research facility developing the next generation of home appliances and cleaning technology.",
      category: "Innovation Labs",
      readTime: "12 min read",
      image: "https://images.unsplash.com/photo-1558618047-3c8c6d68b6c7?w=600&h=400&fit=crop"
    }
  ];

  return (
    <section className="py-16 px-6 lg:px-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Featured Product Stories
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Dive into the latest consumer product innovations and meet the brilliant minds behind tomorrow's must-have items.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Featured Article */}
          <Card className="lg:col-span-2 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img 
                  src={articles[0].image} 
                  alt={articles[0].title}
                  className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="md:w-1/2 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-blue-600 text-white">{articles[0].category}</Badge>
                  <span className="text-sm text-gray-500">{articles[0].readTime}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {articles[0].title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {articles[0].excerpt}
                </p>
              </CardContent>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.slice(1).map((article) => (
            <Card key={article.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <img 
                src={article.image} 
                alt={article.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="secondary">{article.category}</Badge>
                  <span className="text-sm text-gray-500">{article.readTime}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-gray-600">
                  {article.excerpt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedArticles;
