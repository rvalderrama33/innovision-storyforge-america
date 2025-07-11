import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Key, Mail, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SecuritySettings = () => {
  const [settings, setSettings] = useState({
    emailConfirmationRequired: false,
    mfaEnabled: false,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    emailVerificationForSubmissions: false,
  });
  
  const { toast } = useToast();

  const handleSaveSettings = async () => {
    try {
      // Here you would typically save to your backend/Supabase
      toast({
        title: "Security Settings Updated",
        description: "Your security configuration has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save security settings.",
        variant: "destructive",
      });
    }
  };

  const SecurityCard = ({ 
    icon: Icon, 
    title, 
    description, 
    children 
  }: { 
    icon: any; 
    title: string; 
    description: string; 
    children: React.ReactNode;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icon className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Security Settings</h1>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          These settings affect the security of your entire application. Changes will apply to all users immediately.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <SecurityCard
          icon={Mail}
          title="Email Security"
          description="Configure email verification and confirmation requirements"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-confirmation">Require Email Confirmation</Label>
                <p className="text-sm text-gray-500">
                  Users must verify their email address before they can sign in
                </p>
              </div>
              <Switch
                id="email-confirmation"
                checked={settings.emailConfirmationRequired}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, emailConfirmationRequired: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-verification-submissions">Email Verification for Submissions</Label>
                <p className="text-sm text-gray-500">
                  Require email verification before allowing story submissions
                </p>
              </div>
              <Switch
                id="email-verification-submissions"
                checked={settings.emailVerificationForSubmissions}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, emailVerificationForSubmissions: checked }))
                }
              />
            </div>
          </div>
        </SecurityCard>

        <SecurityCard
          icon={Key}
          title="Password Security"
          description="Configure password policies and requirements"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="mfa-enabled">Enable Multi-Factor Authentication</Label>
                <p className="text-sm text-gray-500">
                  Require additional verification for admin accounts
                </p>
              </div>
              <Switch
                id="mfa-enabled"
                checked={settings.mfaEnabled}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, mfaEnabled: checked }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password-expiry">Password Expiry (days)</Label>
              <Input
                id="password-expiry"
                type="number"
                min="30"
                max="365"
                value={settings.passwordExpiryDays}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, passwordExpiryDays: parseInt(e.target.value) }))
                }
                className="w-32"
              />
              <p className="text-sm text-gray-500">
                Users will be required to change their password after this many days
              </p>
            </div>
          </div>
        </SecurityCard>

        <SecurityCard
          icon={Clock}
          title="Login Security"
          description="Configure rate limiting and account lockout policies"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max-attempts">Max Login Attempts</Label>
                <Input
                  id="max-attempts"
                  type="number"
                  min="3"
                  max="10"
                  value={settings.maxLoginAttempts}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))
                  }
                />
                <p className="text-sm text-gray-500">
                  Number of failed attempts before account lockout
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lockout-duration">Lockout Duration (minutes)</Label>
                <Input
                  id="lockout-duration"
                  type="number"
                  min="5"
                  max="60"
                  value={settings.lockoutDurationMinutes}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, lockoutDurationMinutes: parseInt(e.target.value) }))
                  }
                />
                <p className="text-sm text-gray-500">
                  How long to lock out accounts after max attempts
                </p>
              </div>
            </div>
          </div>
        </SecurityCard>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Security Recommendations</h3>
              <p className="text-sm text-gray-600">
                Follow these best practices to keep your application secure
              </p>
            </div>
            <Button onClick={handleSaveSettings} className="ml-4">
              Save Security Settings
            </Button>
          </div>
          
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Enable email confirmation to prevent fake accounts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Set reasonable rate limits to prevent brute force attacks</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Require MFA for admin accounts handling sensitive data</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Monitor failed login attempts and suspicious activity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;