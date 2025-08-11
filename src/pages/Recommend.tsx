import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { Lightbulb, Users, Heart } from "lucide-react";

const Recommend = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    reason: "",
    recommenderName: "",
    recommenderEmail: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First insert the recommendation
      const { error: insertError } = await supabase
        .from("recommendations")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            reason: formData.reason,
            recommender_name: formData.recommenderName,
            recommender_email: formData.recommenderEmail,
          },
        ]);

      if (insertError) throw insertError;

      // Send notification email
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'recommendation',
          to: formData.email,
          name: formData.name,
          recommenderName: formData.recommenderName
        }
      });

      if (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: "Recommendation submitted!",
        description: "Thank you for helping us find amazing entrepreneurs to feature.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        reason: "",
        recommenderName: "",
        recommenderEmail: "",
      });
    } catch (error) {
      console.error("Error submitting recommendation:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting your recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Know Someone Amazing?
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Help us discover incredible entrepreneurs and innovators in your network. 
            Every great story starts with someone who believes in sharing it.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6">
            <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Spotlight Innovation</h3>
            <p className="text-gray-600 text-sm">
              Help innovative products and services reach a wider audience
            </p>
          </div>
          <div className="text-center p-6">
            <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Build Community</h3>
            <p className="text-gray-600 text-sm">
              Connect entrepreneurs with resources and potential collaborators
            </p>
          </div>
          <div className="text-center p-6">
            <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto mb-4">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Share Stories</h3>
            <p className="text-gray-600 text-sm">
              Celebrate the journeys of remarkable people making a difference
            </p>
          </div>
        </div>

        {/* Recommendation Form */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Recommend an Entrepreneur</CardTitle>
            <CardDescription>
              Tell us about someone whose entrepreneurial story deserves to be heard. 
              We're looking for innovators, creators, and problem-solvers who are making an impact.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Person Being Recommended */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Who are you recommending?
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason">Why should we feature them? *</Label>
                  <Textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder="Tell us about their innovation, their journey, the problem they're solving, or what makes their story compelling..."
                  />
                </div>
              </div>

              {/* Recommender Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Your Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recommenderName">Your Name *</Label>
                    <Input
                      id="recommenderName"
                      name="recommenderName"
                      value={formData.recommenderName}
                      onChange={handleInputChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="recommenderEmail">Your Email *</Label>
                    <Input
                      id="recommenderEmail"
                      name="recommenderEmail"
                      type="email"
                      value={formData.recommenderEmail}
                      onChange={handleInputChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? "Submitting..." : "Submit Recommendation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm">
            We review all recommendations and will reach out to exceptional candidates. 
            Thank you for helping us discover amazing stories!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Recommend;