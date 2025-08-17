import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Eye, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalProduct, setApprovalProduct] = useState<any>(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, statusFilter, categoryFilter, stockFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_vendor_id_fkey (
            first_name,
            last_name,
            company,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.profiles?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "pending":
          filtered = filtered.filter(product => product.status === 'pending');
          break;
        case "approved":
          filtered = filtered.filter(product => product.status === 'approved');
          break;
        case "rejected":
          filtered = filtered.filter(product => product.status === 'rejected');
          break;
        case "active":
          filtered = filtered.filter(product => product.is_active && !product.banned);
          break;
        case "inactive":
          filtered = filtered.filter(product => !product.is_active && !product.banned);
          break;
        case "banned":
          filtered = filtered.filter(product => product.banned);
          break;
      }
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter !== "all") {
      switch (stockFilter) {
        case "in_stock":
          filtered = filtered.filter(product => (product.stock_quantity || 0) > 0);
          break;
        case "out_of_stock":
          filtered = filtered.filter(product => (product.stock_quantity || 0) === 0);
          break;
        case "low_stock":
          filtered = filtered.filter(product => (product.stock_quantity || 0) > 0 && (product.stock_quantity || 0) < 5);
          break;
      }
    }

    setFilteredProducts(filtered);
  };

  const handleBanProduct = (product: any) => {
    setSelectedProduct(product);
    setBanReason("");
    setBanDialogOpen(true);
  };

  const confirmBanProduct = async () => {
    if (!selectedProduct || !banReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for banning this product",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          banned: true, 
          banned_reason: banReason.trim(),
          is_active: false 
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Product Banned",
        description: "Product has been banned and the vendor will see the reason."
      });

      setBanDialogOpen(false);
      setSelectedProduct(null);
      setBanReason("");
      fetchProducts();
    } catch (error) {
      console.error('Error banning product:', error);
      toast({
        title: "Error",
        description: "Failed to ban product",
        variant: "destructive"
      });
    }
  };

  const handleUnbanProduct = async (product: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          banned: false, 
          banned_reason: null,
          is_active: true 
        })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Product Unbanned",
        description: "Product has been unbanned and is now active."
      });

      fetchProducts();
    } catch (error) {
      console.error('Error unbanning product:', error);
      toast({
        title: "Error",
        description: "Failed to unban product",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = async (product: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Product Updated",
        description: `Product has been ${product.is_active ? 'deactivated' : 'activated'}.`
      });

      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
    }
  };

  const handleApproveProduct = async (product: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'approved', rejection_reason: null, is_active: true })
        .eq('id', product.id);
      if (error) throw error;
      toast({ title: 'Product Approved', description: 'Product is now live.' });
      fetchProducts();
      setApprovalDialogOpen(false);
      setApprovalProduct(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve product', variant: 'destructive' });
    }
  };
  const handleRejectProduct = async () => {
    if (!approvalProduct || !rejectionReason.trim()) return;
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'rejected', rejection_reason: rejectionReason.trim(), is_active: false })
        .eq('id', approvalProduct.id);
      if (error) throw error;
      toast({ title: 'Product Rejected', description: 'Vendor will see the rejection reason.' });
      fetchProducts();
      setRejectionDialogOpen(false);
      setApprovalProduct(null);
      setRejectionReason("");
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reject product', variant: 'destructive' });
    }
  };

  const getUniqueCategories = () => {
    const categories = products.map(product => product.category).filter(Boolean);
    return [...new Set(categories)];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0).replace('KSh', 'Ksh');
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Out of Stock', variant: 'destructive' as const };
    if (quantity < 5) return { status: 'Low Stock', variant: 'secondary' as const };
    return { status: 'In Stock', variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <p className="text-gray-600 mt-2">Manage and moderate platform products</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {getUniqueCategories().map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setCategoryFilter("all");
                setStockFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Products ({filteredProducts.length} of {products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock_quantity || 0);
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium max-w-48">
                      <div className="truncate" title={product.name}>
                        {product.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="max-w-48">
                      <div className="truncate" title={
                        product.profiles?.company || 
                        `${product.profiles?.first_name || ''} ${product.profiles?.last_name || ''}`.trim() ||
                        product.profiles?.email
                      }>
                        {product.profiles?.company || 
                         `${product.profiles?.first_name || ''} ${product.profiles?.last_name || ''}`.trim() ||
                         product.profiles?.email?.split('@')[0] ||
                         'Unknown Vendor'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={product.stock_quantity === 0 ? 'text-red-500' : 
                                        product.stock_quantity < 5 ? 'text-yellow-500' : 'text-green-500'}>
                          {product.stock_quantity || 0}
                        </span>
                        {product.stock_quantity < 5 && product.stock_quantity > 0 && (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.status === 'pending' ? (
                        <Badge variant="secondary">Pending</Badge>
                      ) : product.status === 'approved' ? (
                        <Badge variant="default">Approved</Badge>
                      ) : product.status === 'rejected' ? (
                        <Badge variant="destructive">Rejected</Badge>
                      ) : product.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                      {product.status === 'rejected' && product.rejection_reason && (
                        <p className="text-xs text-gray-500 mt-1 max-w-48 truncate" title={product.rejection_reason}>
                          Reason: {product.rejection_reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.status === 'pending' ? (
                        <Button size="sm" variant="outline" onClick={() => { setApprovalProduct(product); setApprovalDialogOpen(true); }}>View Details</Button>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {product.banned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnbanProduct(product)}
                          >
                            Unban
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant={product.is_active ? "secondary" : "default"}
                              onClick={() => handleToggleActive(product)}
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBanProduct(product)}
                            >
                              Ban
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {products.length === 0 ? 'No products found' : 'No products match your filters'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ban Reason Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban Product</DialogTitle>
            <DialogDescription>
              Provide a reason for banning this product. The vendor will see this reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Product:</label>
              <p className="text-sm text-gray-600">{selectedProduct?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Vendor:</label>
              <p className="text-sm text-gray-600">
                {selectedProduct?.profiles?.company || 
                 `${selectedProduct?.profiles?.first_name || ''} ${selectedProduct?.profiles?.last_name || ''}`.trim() ||
                 selectedProduct?.profiles?.email ||
                 'Unknown Vendor'
                }
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Ban Reason:</label>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for banning this product..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setBanDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmBanProduct}
                disabled={!banReason.trim()}
              >
                Ban Product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {approvalProduct && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Product:</label>
                <p className="text-sm text-gray-600">{approvalProduct.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Description:</label>
                <p className="text-sm text-gray-600">{approvalProduct.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Images:</label>
                <div className="flex gap-2 flex-wrap">
                  {(approvalProduct.images || []).map((img: string, idx: number) => (
                    <img key={idx} src={img} alt="Product" className="w-24 h-24 object-cover rounded border" />
                  ))}
                  {!approvalProduct.images?.length && <span className="text-xs text-gray-400">No images</span>}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>Close</Button>
                <Button variant="default" onClick={() => handleApproveProduct(approvalProduct)}>Approve</Button>
                <Button variant="destructive" onClick={() => { setRejectionDialogOpen(true); setApprovalDialogOpen(false); }}>Reject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Product</DialogTitle>
            <DialogDescription>Provide a reason for rejection. The vendor will see this reason.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={4}
              required
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectProduct} disabled={!rejectionReason.trim()}>Reject Product</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;