import Header from "@/components/Header";
import EmailPreview from "@/components/EmailPreview";

const EmailPreviewPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <EmailPreview />
      </div>
    </div>
  );
};

export default EmailPreviewPage;