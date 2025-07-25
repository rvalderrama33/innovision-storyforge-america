import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecurityConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  actionType: 'danger' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
}

const SecurityConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  actionType,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: SecurityConfirmDialogProps) => {
  const getIcon = () => {
    switch (actionType) {
      case 'danger':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      default:
        return <Shield className="h-6 w-6 text-primary" />;
    }
  };

  const getActionVariant = () => {
    switch (actionType) {
      case 'danger':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            className={actionType === 'danger' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SecurityConfirmDialog;