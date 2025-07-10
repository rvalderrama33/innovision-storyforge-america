
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

import Header from "@/components/Header";

const About = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link to="/" className="inline-flex items-center text-blue-200 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Magazine
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About America Innovates Magazine
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Spotlighting the entrepreneurs and creators behind breakthrough consumer products.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="space-y-12">
          {/* Mission */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                America Innovates Magazine showcases the entrepreneurs and creators behind breakthrough consumer 
                products that make everyday life better. We spotlight the innovators who are building the future 
                through practical solutions and groundbreaking products that enhance how we live, work, and play.
              </p>
            </CardContent>
          </Card>

          {/* What We Feature */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Feature</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🛍️ Consumer Products</h3>
                  <p className="text-gray-600">Innovative products that solve real problems and improve daily life</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">👥 Entrepreneur Stories</h3>
                  <p className="text-gray-600">Personal journeys of creators bringing their visions to life</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">💡 Innovation Insights</h3>
                  <p className="text-gray-600">Behind-the-scenes looks at product development and creative processes</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🚀 Market Breakthroughs</h3>
                  <p className="text-gray-600">Products disrupting industries and creating new market categories</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🎯 Problem Solvers</h3>
                  <p className="text-gray-600">Innovations addressing everyday challenges with elegant solutions</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🌟 Featured Creators</h3>
                  <p className="text-gray-600">Highlighting diverse voices and perspectives in product innovation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Your Story */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-orange-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Share Your Product Story</h2>
              <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
                Are you an entrepreneur or creator with an innovative consumer product? We'd love to feature 
                your breakthrough creation and share your journey with our community of innovators and consumers.
              </p>
              <Link to="/submit">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                  Submit Your Story
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Get in Touch</h2>
              <p className="text-lg text-gray-700 mb-4">
                Have a story tip, want to collaborate, or just want to say hello?
              </p>
              <div className="space-y-2">
                <p className="text-gray-600">📧 Email: stories@americainnovates.com</p>
                <p className="text-gray-600">📱 Twitter: @AmericaInnovates</p>
                <p className="text-gray-600">💼 LinkedIn: America Innovates Magazine</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
