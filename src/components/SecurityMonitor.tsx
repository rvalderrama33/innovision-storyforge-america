import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Clock, User, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminAction {
  id: string;
  action_type: string;
  admin_user_id: string;
  target_user_id: string | null;
  target_resource: string | null;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AccountLockout {
  id: string;
  email: string;
  failed_attempts: number;
  locked_until: string | null;
  last_attempt: string;
  created_at: string;
}

const SecurityMonitor = () => {
  const { toast } = useToast();
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [accountLockouts, setAccountLockouts] = useState<AccountLockout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Load recent admin actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (actionsError) {
        console.error('Error loading admin actions:', actionsError);
      } else {
        setAdminActions(actionsData || []);
      }

      // Load account lockouts
      const { data: lockoutsData, error: lockoutsError } = await supabase
        .from('account_lockouts')
        .select('*')
        .order('last_attempt', { ascending: false })
        .limit(10);

      if (lockoutsError) {
        console.error('Error loading account lockouts:', lockoutsError);
      } else {
        setAccountLockouts(lockoutsData || []);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const unlockAccount = async (email: string) => {
    try {
      await supabase.rpc('reset_login_attempts', { _email: email });
      
      toast({
        title: "Success",
        description: `Account unlocked for ${email}`,
      });
      
      loadSecurityData();
    } catch (error) {
      console.error('Error unlocking account:', error);
      toast({
        title: "Error",
        description: "Failed to unlock account",
        variant: "destructive",
      });
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'role_assignment':
      case 'role_revocation':
        return 'destructive';
      case 'article_approval':
      case 'article_rejection':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const activeLockouts = accountLockouts.filter(lockout => 
    lockout.locked_until && new Date(lockout.locked_until) > new Date()
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading security data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Admin Actions</p>
                <p className="text-2xl font-bold">{adminActions.length}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Lockouts</p>
                <p className="text-2xl font-bold text-destructive">{activeLockouts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Failed Attempts</p>
                <p className="text-2xl font-bold">
                  {accountLockouts.reduce((sum, lockout) => sum + lockout.failed_attempts, 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Lockouts Alert */}
      {activeLockouts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {activeLockouts.length} account(s) are currently locked due to failed login attempts.
          </AlertDescription>
        </Alert>
      )}

      {/* Account Lockouts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Account Lockouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {accountLockouts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No account lockouts recorded</p>
          ) : (
            <div className="space-y-3">
              {accountLockouts.map((lockout) => {
                const isLocked = lockout.locked_until && new Date(lockout.locked_until) > new Date();
                return (
                  <div key={lockout.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lockout.email}</span>
                        {isLocked && <Badge variant="destructive">Locked</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lockout.failed_attempts} failed attempts • Last: {formatTimeAgo(lockout.last_attempt)}
                        {lockout.locked_until && (
                          <> • Locked until: {new Date(lockout.locked_until).toLocaleString()}</>
                        )}
                      </p>
                    </div>
                    {isLocked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unlockAccount(lockout.email)}
                      >
                        Unlock
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Recent Admin Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adminActions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No admin actions recorded</p>
          ) : (
            <div className="space-y-3">
              {adminActions.map((action) => (
                <div key={action.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getActionBadgeColor(action.action_type)}>
                        {action.action_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatTimeAgo(action.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-sm font-medium mb-1">{action.description}</p>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Admin: {action.admin_user_id}</div>
                      {action.target_user_id && <div>Target: {action.target_user_id}</div>}
                      {action.target_resource && <div>Resource: {action.target_resource}</div>}
                      {action.ip_address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          IP: {action.ip_address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityMonitor;