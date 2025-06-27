
import { Card, CardContent } from "@/components/ui/card";

const CategoryGrid = () => {
  const categories = [
    {
      title: "Spotlight Profiles",
      description: "In-depth features on breakthrough inventors",
      count: "24 stories",
      color: "bg-blue-600",
      icon: "👤"
    },
    {
      title: "Emerging Innovators",
      description: "Young minds changing the world",
      count: "18 profiles",
      color: "bg-orange-500",
      icon: "🌟"
    },
    {
      title: "Innovation Labs",
      description: "Inside the world's leading R&D facilities",
      count: "12 features",
      color: "bg-purple-600",
      icon: "🔬"
    },
    {
      title: "Historical Inventors",
      description: "Celebrating the pioneers who paved the way",
      count: "15 tributes",
      color: "bg-green-600",
      icon: "📜"
    },
    {
      title: "Tech Breakthroughs",
      description: "The latest in cutting-edge technology",
      count: "32 articles",
      color: "bg-red-500",
      icon: "⚡"
    },
    {
      title: "Global Impact",
      description: "Innovations solving worldwide challenges",
      count: "21 stories",
      color: "bg-teal-600",
      icon: "🌍"
    }
  ];

  return (
    <section className="py-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explore by Category
          </h2>
          <p className="text-xl text-gray-600">
            Discover stories across every field of innovation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg"
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center text-white text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {category.title}
                </h3>
                <p className="text-gray-600 mb-3">
                  {category.description}
                </p>
                <span className="text-sm font-medium text-gray-500">
                  {category.count}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
