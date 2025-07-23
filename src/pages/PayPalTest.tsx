import Header from "@/components/Header";
import PayPalTest from "@/components/PayPalTest";

const PayPalTestPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">PayPal Connection Test</h1>
          <p className="text-gray-600">
            Test your PayPal integration with a $1 transaction to verify everything is working correctly.
          </p>
        </div>
        <PayPalTest />
      </div>
    </div>
  );
};

export default PayPalTestPage;