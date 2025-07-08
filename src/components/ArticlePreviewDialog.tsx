import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface ArticlePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any;
  onApprove: (submissionId: string) => void;
  onReject: (submissionId: string) => void;
}

const ArticlePreviewDialog = ({ 
  isOpen, 
  onClose, 
  submission, 
  onApprove, 
  onReject 
}: ArticlePreviewDialogProps) => {
  if (!submission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Article Preview</DialogTitle>
          <DialogDescription>
            Review the generated article before making a decision
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Article Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {submission.product_name}
            </h1>
          </div>

          {/* Images */}
          {submission.image_urls && submission.image_urls.length > 0 && (
            <div className="mb-6">
              {submission.image_urls.length === 1 ? (
                <img
                  src={submission.image_urls[0]}
                  alt={submission.product_name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {submission.image_urls.map((imageUrl: string, index: number) => (
                    <img
                      key={index}
                      src={imageUrl}
                      alt={`${submission.product_name} image ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {submission.generated_article}
            </div>
          </div>

          {/* Creator Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About the Creator</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {submission.full_name}</p>
              <p><strong>Location:</strong> {submission.city}, {submission.state}</p>
              <p><strong>Email:</strong> {submission.email}</p>
              {submission.website && (
                <p><strong>Website:</strong> {submission.website}</p>
              )}
              {submission.background && (
                <p><strong>Background:</strong> {submission.background}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {submission.status === 'pending' && (
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onReject(submission.id);
                  onClose();
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  onApprove(submission.id);
                  onClose();
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArticlePreviewDialog;