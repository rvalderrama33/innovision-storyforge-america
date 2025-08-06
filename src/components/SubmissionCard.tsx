
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, CheckCircle, XCircle, Star, Pin, Edit, Trash2, Mail } from "lucide-react";
import { Link } from "react-router-dom";

interface SubmissionCardProps {
  submission: any;
  onPreview: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onToggleFeatured: (id: string, featured: boolean) => void;
  onTogglePinned: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  onSendUpgradeEmail?: (submissionId: string, submissionData: any) => void;
  onPaymentSuccess?: () => void;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    case 'pending': return 'secondary';
    default: return 'outline';
  }
};

export const SubmissionCard = ({ submission, onPreview, onUpdateStatus, onToggleFeatured, onTogglePinned, onDelete, onSendUpgradeEmail }: SubmissionCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-2">{submission.product_name}</CardTitle>
            <CardDescription className="text-base">
              by {submission.full_name} • {submission.email}
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              {submission.description}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={getStatusVariant(submission.status)}>
              {submission.status}
            </Badge>
            {submission.featured && (
              <Badge variant="secondary">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {submission.pinned && (
              <Badge variant="outline">
                <Pin className="w-3 h-3 mr-1" />
                Pinned
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={onPreview}
            size="sm"
            variant="outline"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          
          <Select
            value={submission.status}
            onValueChange={(value) => onUpdateStatus(submission.id, value)}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => onToggleFeatured(submission.id, !submission.featured)}
            size="sm"
            variant={submission.featured ? "secondary" : "outline"}
          >
            <Star className="w-4 h-4 mr-2" />
            {submission.featured ? 'Unfeature' : 'Feature'}
          </Button>
          
          <Button
            onClick={() => onTogglePinned(submission.id, !submission.pinned)}
            size="sm"
            variant={submission.pinned ? "secondary" : "outline"}
          >
            <Pin className="w-4 h-4 mr-2" />
            {submission.pinned ? 'Unpin' : 'Pin'}
          </Button>
          
          {submission.status === 'approved' && !submission.featured && submission.email && onSendUpgradeEmail && (
            <Button
              onClick={() => onSendUpgradeEmail(submission.id, submission)}
              size="sm"
              variant="outline"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Upgrade Email
            </Button>
          )}
          
          <Link to={`/admin/edit/${submission.id}`}>
            <Button
              size="sm"
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Article
            </Button>
          </Link>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Article</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{submission.product_name}"? 
                  This action cannot be undone and will permanently remove the article.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(submission.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Article
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
