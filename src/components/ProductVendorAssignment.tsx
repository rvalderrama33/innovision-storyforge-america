import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from "sonner";
import { Package, User, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  vendor_id: string;
  status: string;
  price: number;
  currency: string;
  created_at: string;
}

interface Vendor {
  user_id: string;
  business_name: string;
  contact_email: string;
  status: string;
}

interface ProductAssignment {
  productId: string;
  currentVendorId: string;
  newVendorId: string;
}

export const ProductVendorAssignment = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<ProductAssignment[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch all products
      const { data: productsData, error: productsError } = await supabase
        .from('marketplace_products')
        .select('id, name, vendor_id, status, price, currency, created_at')
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch all approved vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendor_applications')
        .select('user_id, business_name, contact_email, status')
        .eq('status', 'approved');

      if (vendorsError) throw vendorsError;

      setProducts(productsData || []);
      setVendors(vendorsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVendorChange = (productId: string, currentVendorId: string, newVendorId: string) => {
    if (currentVendorId === newVendorId) {
      // Remove from assignments if reverting to original
      setAssignments(prev => prev.filter(a => a.productId !== productId));
    } else {
      // Add or update assignment
      setAssignments(prev => {
        const existing = prev.find(a => a.productId === productId);
        if (existing) {
          return prev.map(a => a.productId === productId ? { ...a, newVendorId } : a);
        } else {
          return [...prev, { productId, currentVendorId, newVendorId }];
        }
      });
    }
  };

  const saveAssignments = async () => {
    if (assignments.length === 0) {
      toast.error('No changes to save');
      return;
    }

    setSaving(true);
    try {
      // Update products with new vendor assignments
      for (const assignment of assignments) {
        const { error } = await supabase
          .from('marketplace_products')
          .update({ vendor_id: assignment.newVendorId })
          .eq('id', assignment.productId);

        if (error) throw error;
      }

      toast.success(`Successfully reassigned ${assignments.length} product(s)`);
      setAssignments([]);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast.error('Failed to save assignments');
    } finally {
      setSaving(false);
    }
  };

  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find(v => v.user_id === vendorId);
    return vendor ? vendor.business_name : 'Unknown Vendor';
  };

  const getCurrentVendorId = (productId: string) => {
    const assignment = assignments.find(a => a.productId === productId);
    const product = products.find(p => p.id === productId);
    return assignment ? assignment.newVendorId : (product?.vendor_id || '');
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price / 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Vendor Assignment
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Reassign products to different vendors ({products.length} total products)
            </p>
          </div>
          {assignments.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {assignments.length} pending change{assignments.length > 1 ? 's' : ''}
              </Badge>
              <Button 
                onClick={saveAssignments} 
                disabled={saving}
                className="gap-2"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">No products available for assignment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Vendor</TableHead>
                  <TableHead>Assign to Vendor</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const currentVendorId = getCurrentVendorId(product.id);
                  const hasChanges = assignments.some(a => a.productId === product.id);
                  
                  return (
                    <TableRow key={product.id} className={hasChanges ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <div className="font-medium">{product.name}</div>
                      </TableCell>
                      <TableCell>
                        {formatPrice(product.price, product.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{getVendorName(product.vendor_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={currentVendorId}
                          onValueChange={(value) => handleVendorChange(product.id, product.vendor_id, value)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendors.map((vendor) => (
                              <SelectItem key={vendor.user_id} value={vendor.user_id}>
                                {vendor.business_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {hasChanges && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <ArrowRight className="h-4 w-4" />
                            <span>Changed</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};