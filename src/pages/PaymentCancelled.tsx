import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";

const PaymentCancelled = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <XCircle className="h-6 w-6" />
                Payment Cancelled
              </CardTitle>
              <CardDescription className="text-orange-700">
                Your payment was cancelled and no charges were made.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-2">What happened?</h3>
                <p className="text-sm text-orange-700">
                  You cancelled the payment process before it was completed. No charges were made to your payment method.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-2">Want to try again?</h3>
                <p className="text-sm text-orange-700 mb-3">
                  You can upgrade your story to featured status at any time. Featured stories get:
                </p>
                <ul className="space-y-1 text-sm text-orange-700">
                  <li>• Homepage highlighting for 30 days</li>
                  <li>• Increased visibility and engagement</li>
                  <li>• Professional placement and styling</li>
                </ul>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Homepage
                </Button>
                <Button 
                  onClick={() => window.location.href = '/admin'}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;