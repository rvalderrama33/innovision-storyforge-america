
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
      image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
    }
  ];

  return (
    <section className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Featured Stories
          </h2>
          <div className="w-24 h-1 bg-gray-900 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            Dive into the latest consumer product innovations and meet the brilliant minds behind tomorrow's must-have items.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Featured Article */}
          <div className="lg:col-span-8">
            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group cursor-pointer border-0 shadow-lg">
              <div className="relative">
                <img 
                  src={articles[0].image} 
                  alt={articles[0].title}
                  className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 mb-4">
                    {articles[0].category}
                  </Badge>
                  <h3 className="text-3xl font-bold mb-3 leading-tight">
                    {articles[0].title}
                  </h3>
                  <p className="text-white/90 text-lg leading-relaxed">
                    {articles[0].excerpt}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Side Articles */}
          <div className="lg:col-span-4 space-y-6">
            {articles.slice(1).map((article) => (
              <Card key={article.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border border-gray-200">
                <div className="flex">
                  <div className="w-1/3">
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="w-2/3 p-6 flex flex-col justify-center">
                    <Badge variant="secondary" className="mb-2 w-fit text-xs">
                      {article.category}
                    </Badge>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors leading-tight">
                      {article.title}
                    </h3>
                    <span className="text-sm text-gray-500">{article.readTime}</span>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedArticles;
