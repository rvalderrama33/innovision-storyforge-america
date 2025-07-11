import Header from "@/components/Header";
import { useSEO } from "@/hooks/useSEO";

const TermsOfService = () => {
  useSEO({
    title: "Terms of Service | America Innovates Magazine",
    description: "Read the terms of service for America Innovates Magazine. Learn about your rights and responsibilities when using our platform.",
    url: "https://americainnovates.us/terms-of-service"
  });
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto py-12 px-6 lg:px-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using America Innovates Magazine, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Use License</h2>
            <p className="text-gray-700 mb-4">
              Permission is granted to temporarily download one copy of the materials on America Innovates Magazine for personal, non-commercial transitory viewing only.
            </p>
            <p className="text-gray-700 mb-4">This license shall automatically terminate if you violate any of these restrictions.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content Submission</h2>
            <p className="text-gray-700 mb-4">
              When you submit content to us:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>You retain ownership of your intellectual property</li>
              <li>You grant us a license to publish and distribute your content</li>
              <li>You represent that the content is original and does not infringe on others' rights</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              The materials on America Innovates Magazine are provided on an 'as is' basis. America Innovates Magazine makes no warranties, expressed or implied.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700">
              If you have questions about these Terms of Service, please contact us at legal@americainnovates.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;