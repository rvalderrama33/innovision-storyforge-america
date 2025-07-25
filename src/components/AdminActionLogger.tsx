import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Shield, User, Activity, AlertTriangle } from 'lucide-react';

interface AdminAction {
  id: string;
  created_at: string;
  admin_user_id: string;
  target_user_id?: string;
  action_type: string;
  target_resource?: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
}

const AdminActionLogger = () => {
  const { isAdmin } = useAuth();
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminActions();
    }
  }, [isAdmin]);

  const fetchAdminActions = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActions(data || []);
    } catch (error) {
      console.error('Error fetching admin actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'role_assignment':
        return <Shield className="h-4 w-4" />;
      case 'user_management':
        return <User className="h-4 w-4" />;
      case 'security_action':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'role_assignment':
        return 'destructive' as const;
      case 'security_action':
        return 'secondary' as const;
      default:
        return 'default' as const;
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Activity Log
          <Badge variant="outline" className="ml-auto">
            {actions.length} actions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {actions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No admin actions recorded yet
            </p>
          ) : (
            actions.map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <div className="mt-1">
                  {getActionIcon(action.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getActionBadgeVariant(action.action_type)}>
                      {action.action_type.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mb-1">
                    {action.description}
                  </p>
                  {action.target_resource && (
                    <p className="text-xs text-muted-foreground">
                      Resource: {action.target_resource}
                    </p>
                  )}
                  {action.ip_address && (
                    <p className="text-xs text-muted-foreground">
                      IP: {action.ip_address}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminActionLogger;