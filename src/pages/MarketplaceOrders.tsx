import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { useMarketplaceConfig } from "@/hooks/useMarketplaceConfig";
import { Package, Truck, Eye, DollarSign, Calendar } from "lucide-react";

interface MarketplaceOrder {
  id: string;
  product_id: string;
  buyer_id: string;
  vendor_id: string;
  quantity: number;
  price?: number; // Optional since the database might not have this field
  total_amount: number;
  currency: string;
  status: string;
  tracking_number?: string;
  shipping_address?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
  product?: {
    name: string;
    images?: string[];
  };
  buyer?: {
    email?: string;
    full_name?: string;
  } | null;
}

interface VendorStats {
  totalOrdersThisMonth: number;
  totalEarningsThisMonth: number;
  totalOrdersAll: number;
  totalEarningsAll: number;
}

const MarketplaceOrders = () => {
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL RETURNS
  const { user, isAdmin, isVendor } = useAuth();
  const { isMarketplaceLive, loading: configLoading } = useMarketplaceConfig();
  const { toast } = useToast();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [stats, setStats] = useState<VendorStats>({
    totalOrdersThisMonth: 0,
    totalEarningsThisMonth: 0,
    totalOrdersAll: 0,
    totalEarningsAll: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState(false);
  
  useSEO({
    title: "Orders | Marketplace",
    description: "Manage your marketplace orders and tracking information.",
    url: "https://americainnovates.us/marketplace/orders"
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: ordersData, error: ordersError } = await supabase
          .from('marketplace_orders')
          .select(`
            *,
            product:marketplace_products(name, images)
          `)
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        setOrders(ordersData || []);
        calculateStats(ordersData || []);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error",
          description: "Failed to load orders.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id, toast]);

  const calculateStats = (ordersData: MarketplaceOrder[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthOrders = ordersData.filter(order => 
      new Date(order.created_at) >= startOfMonth &&
      ['confirmed', 'shipped', 'delivered'].includes(order.status)
    );
    
    const allCompletedOrders = ordersData.filter(order => 
      ['confirmed', 'shipped', 'delivered'].includes(order.status)
    );

    const totalEarningsThisMonth = thisMonthOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalEarningsAll = allCompletedOrders.reduce((sum, order) => sum + order.total_amount, 0);

    setStats({
      totalOrdersThisMonth: thisMonthOrders.length,
      totalEarningsThisMonth: Math.round(totalEarningsThisMonth * 0.8), // 80% after platform fee
      totalOrdersAll: allCompletedOrders.length,
      totalEarningsAll: Math.round(totalEarningsAll * 0.8) // 80% after platform fee
    });
  };

  // NOW WE CAN HAVE CONDITIONAL RETURNS
  if (configLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isMarketplaceLive && !isAdmin) {
    return <Navigate to="/" />;
  }

  if (!user || (!isAdmin && !isVendor)) {
    return <Navigate to="/auth" replace />;
  }


  const updateOrderStatus = async (orderId: string, status: string, tracking?: string) => {
    setUpdatingOrder(true);
    try {
      const updateData: any = { status };
      if (tracking) {
        updateData.tracking_number = tracking;
      }

      const { error } = await supabase
        .from('marketplace_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Send customer notification if order is shipped with tracking
      if (status === 'shipped' && tracking) {
        try {
          await supabase.functions.invoke('notify-customer-tracking', {
            body: { order_id: orderId }
          });
        } catch (notifyError) {
          console.error('Failed to send customer notification:', notifyError);
          // Don't fail the order update if email fails
        }
      }

      toast({
        title: "Success",
        description: `Order ${status === 'shipped' ? 'marked as shipped and customer notified' : 'updated'} successfully!`
      });

      // Refresh the orders by calling the effect again
      if (user?.id) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('marketplace_orders')
          .select(`
            *,
            product:marketplace_products(name, images)
          `)
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: false });

        if (!ordersError && ordersData) {
          setOrders(ordersData);
          calculateStats(ordersData);
        }
      }
      
      setSelectedOrder(null);
      setTrackingNumber("");
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update order.",
        variant: "destructive"
      });
    } finally {
      setUpdatingOrder(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "secondary", 
      shipped: "default",
      delivered: "secondary",
      cancelled: "destructive"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className="text-muted-foreground">Track and manage your marketplace orders</p>
        </div>

        {/* Vendor Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Orders This Month</p>
                  <p className="text-2xl font-bold">{stats.totalOrdersThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Earnings This Month</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.totalEarningsThisMonth, 'USD')}</p>
                  <p className="text-xs text-muted-foreground">After 20% platform fee</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrdersAll}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.totalEarningsAll, 'USD')}</p>
                  <p className="text-xs text-muted-foreground">After 20% platform fee</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payout Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>💰 Payout Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-semibold">Current Month Payout</h3>
                  <p className="text-sm text-muted-foreground">
                    Earnings from {stats.totalOrdersThisMonth} shipped orders
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(stats.totalEarningsThisMonth, 'USD')}
                  </p>
                  <Badge variant="outline">Manual Processing</Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Payouts are processed manually at the end of each month</p>
                <p>• Platform fee: 20% (you receive 80% of order value)</p>
                <p>• Minimum payout threshold: $50.00</p>
                <p>• Contact support for payout inquiries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Orders ({orders.length})</CardTitle>
          </CardHeader>
          
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground">Orders from customers will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {order.product?.images?.[0] && (
                              <img 
                                src={order.product.images[0]} 
                                alt={order.product?.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div>
                              <div className="font-medium">{order.product?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.price ? formatPrice(order.price, order.currency) : formatPrice(order.total_amount / order.quantity, order.currency)} each
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">Customer</div>
                            <div className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(order.total_amount, order.currency)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell>
                          {order.tracking_number ? (
                            <span className="text-sm">{order.tracking_number}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Not set</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setTrackingNumber(order.tracking_number || "");
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Order Details</DialogTitle>
                                </DialogHeader>
                                {selectedOrder && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Order ID</Label>
                                        <p className="text-sm text-muted-foreground">{selectedOrder.id}</p>
                                      </div>
                                      <div>
                                        <Label>Status</Label>
                                        <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                                      </div>
                                    </div>
                                    
                                    {selectedOrder.status === 'pending' && (
                                      <div className="space-y-4 border-t pt-4">
                                        <h3 className="font-semibold">Process Order</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          <Button
                                            onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                                            disabled={updatingOrder}
                                          >
                                            {updatingOrder ? "Updating..." : "Confirm Order"}
                                          </Button>
                                          <div className="space-y-2">
                                            <Label htmlFor="tracking-pending">Tracking Number (optional)</Label>
                                            <Input
                                              id="tracking-pending"
                                              value={trackingNumber}
                                              onChange={(e) => setTrackingNumber(e.target.value)}
                                              placeholder="Enter tracking number"
                                            />
                                            <Button
                                              onClick={() => updateOrderStatus(selectedOrder.id, 'shipped', trackingNumber)}
                                              disabled={updatingOrder || !trackingNumber.trim()}
                                              variant="outline"
                                              className="w-full"
                                            >
                                              {updatingOrder ? "Updating..." : "Ship Now"}
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {selectedOrder.status === 'confirmed' && (
                                      <div className="space-y-4 border-t pt-4">
                                        <h3 className="font-semibold">Ship Order</h3>
                                        <div>
                                          <Label htmlFor="tracking">Tracking Number</Label>
                                          <Input
                                            id="tracking"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="Enter tracking number"
                                          />
                                        </div>
                                        <Button
                                          onClick={() => updateOrderStatus(selectedOrder.id, 'shipped', trackingNumber)}
                                          disabled={updatingOrder || !trackingNumber.trim()}
                                          className="w-full"
                                        >
                                          <Truck className="mr-2 h-4 w-4" />
                                          {updatingOrder ? "Updating..." : "Mark as Shipped"}
                                        </Button>
                                      </div>
                                    )}

                                    {selectedOrder.status === 'shipped' && (
                                      <div className="space-y-4 border-t pt-4">
                                        {selectedOrder.tracking_number && (
                                          <div className="space-y-2">
                                            <Label>Current Tracking Number</Label>
                                            <p className="text-sm">{selectedOrder.tracking_number}</p>
                                            <div>
                                              <Label htmlFor="new-tracking">Update Tracking Number</Label>
                                              <Input
                                                id="new-tracking"
                                                value={trackingNumber}
                                                onChange={(e) => setTrackingNumber(e.target.value)}
                                                placeholder="Enter new tracking number"
                                              />
                                            </div>
                                            <Button
                                              onClick={() => updateOrderStatus(selectedOrder.id, 'shipped', trackingNumber)}
                                              disabled={updatingOrder || !trackingNumber.trim()}
                                              variant="outline"
                                            >
                                              {updatingOrder ? "Updating..." : "Update Tracking"}
                                            </Button>
                                          </div>
                                        )}
                                        <Button
                                          onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                                          disabled={updatingOrder}
                                          className="w-full"
                                        >
                                          {updatingOrder ? "Updating..." : "Mark as Delivered"}
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketplaceOrders;