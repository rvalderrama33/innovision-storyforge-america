
import { Card, CardContent } from "@/components/ui/card";

const CategoryGrid = () => {
  const categories = [
    {
      title: "Home & Living",
      description: "Smart appliances, furniture, and lifestyle products",
      count: "32 products",
      color: "bg-blue-600",
      icon: "🏠"
    },
    {
      title: "Health & Wellness",
      description: "Fitness trackers, wellness devices, and health gadgets",
      count: "28 innovations",
      color: "bg-green-600",
      icon: "💪"
    },
    {
      title: "Kitchen & Food",
      description: "Cooking gadgets, food tech, and culinary innovations",
      count: "24 products",
      color: "bg-orange-500",
      icon: "🍳"
    },
    {
      title: "Tech Accessories",
      description: "Phone cases, chargers, and digital lifestyle products",
      count: "35 items",
      color: "bg-purple-600",
      icon: "📱"
    },
    {
      title: "Outdoor & Travel",
      description: "Adventure gear, travel accessories, and outdoor innovations",
      count: "19 products",
      color: "bg-teal-600",
      icon: "🎒"
    },
    {
      title: "Kids & Family",
      description: "Educational toys, family products, and child safety innovations",
      count: "22 stories",
      color: "bg-red-500",
      icon: "👨‍👩‍👧‍👦"
    }
  ];

  return (
    <section className="py-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explore by Product Category
          </h2>
          <p className="text-xl text-gray-600">
            Discover consumer product innovations across every aspect of daily life
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
