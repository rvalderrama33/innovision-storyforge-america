
import { Card, CardContent } from "@/components/ui/card";

const CategoryGrid = () => {
  const categories = [
    {
      title: "Home & Living",
      description: "Smart appliances, furniture, and lifestyle products",
      count: "32 products",
      color: "bg-gray-900",
      icon: "🏠"
    },
    {
      title: "Health & Wellness",
      description: "Fitness trackers, wellness devices, and health gadgets",
      count: "28 innovations",
      color: "bg-gray-800",
      icon: "💪"
    },
    {
      title: "Kitchen & Food",
      description: "Cooking gadgets, food tech, and culinary innovations",
      count: "24 products",
      color: "bg-gray-700",
      icon: "🍳"
    },
    {
      title: "Tech Accessories",
      description: "Phone cases, chargers, and digital lifestyle products",
      count: "35 items",
      color: "bg-gray-600",
      icon: "📱"
    },
    {
      title: "Outdoor & Travel",
      description: "Adventure gear, travel accessories, and outdoor innovations",
      count: "19 products",
      color: "bg-gray-500",
      icon: "🎒"
    },
    {
      title: "Kids & Family",
      description: "Educational toys, family products, and child safety innovations",
      count: "22 stories",
      color: "bg-gray-400",
      icon: "👨‍👩‍👧‍👦"
    }
  ];

  return (
    <section className="py-16 px-6 lg:px-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Categories
          </h2>
          <div className="w-24 h-1 bg-gray-900 mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 font-light">
            Discover consumer product innovations across every aspect of daily life
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md bg-white"
            >
              <CardContent className="p-8 text-center">
                <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center text-white text-2xl mb-6 mx-auto group-hover:scale-110 transition-transform`}>
                  {category.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-600 transition-colors">
                  {category.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {category.description}
                </p>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
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
