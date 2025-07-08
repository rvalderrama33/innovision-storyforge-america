
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
            About America Innovates
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            Celebrating the inventors, disruptors, and breakthrough ideas shaping tomorrow's world.
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
                America Innovates Magazine exists to spotlight the brilliant minds and groundbreaking inventions 
                that are solving real-world problems and shaping our future. We believe every innovation has a 
                story worth telling, and every inventor deserves recognition for their contribution to progress.
              </p>
            </CardContent>
          </Card>

          {/* What We Cover */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Cover</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🌟 Spotlight Profiles</h3>
                  <p className="text-gray-600">In-depth features on breakthrough inventors and their journeys</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🚀 Emerging Innovators</h3>
                  <p className="text-gray-600">Young minds and first-time inventors changing the world</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🔬 Innovation Labs</h3>
                  <p className="text-gray-600">Inside the world's leading R&D facilities and research centers</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">📜 Historical Inventors</h3>
                  <p className="text-gray-600">Celebrating the pioneers who paved the way for today's innovations</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">⚡ Tech Breakthroughs</h3>
                  <p className="text-gray-600">The latest in cutting-edge technology and scientific discoveries</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🌍 Global Impact</h3>
                  <p className="text-gray-600">Innovations solving worldwide challenges and creating positive change</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Your Story */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-orange-50">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Share Your Innovation Story</h2>
              <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
                Are you an inventor, entrepreneur, or innovator with a story to tell? We'd love to feature 
                your breakthrough idea and share your journey with our community of forward-thinkers.
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
