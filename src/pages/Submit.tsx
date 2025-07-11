
import Header from "@/components/Header";
import SubmissionWizard from "@/components/SubmissionWizard";
import { useSEO } from "@/hooks/useSEO";

const Submit = () => {
  useSEO({
    title: "Submit Your Innovation | America Innovates Magazine",
    description: "Share your innovation story with America Innovates Magazine. Submit your breakthrough consumer product and inspire others with your entrepreneurial journey.",
    url: "https://americainnovates.us/submit"
  });
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SubmissionWizard />
    </div>
  );
};

export default Submit;
