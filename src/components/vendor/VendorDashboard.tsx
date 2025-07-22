
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Package, ShoppingCart, LogOut, Plus, Eye, Edit, Trash2, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductService } from "@/services/productService";
import { ImageUploadService } from "@/services/imageUploadService";
import { OrderService } from "@/services/orderService";
import { Product } from "@/types/product";
import { OrderWithDetails } from "@/types/order";
import VendorProductManagement from './VendorProductManagement';

interface VendorDashboardProps {
  user: any;
  onLogout: () => void;
}

const VendorDashboard = ({ user, onLogout }: VendorDashboardProps) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'upload'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock_quantity: "",
    brand: "",
    pickup_location: "",
    pickup_phone_number: "",
    image: null as File | null,
    imageUrl: "" // For image links
  });
  const { toast } = useToast();

  // Load vendor's products and orders on component mount
  useEffect(() => {
    if (user?.id) {
      loadVendorProducts();
      loadVendorOrders();
    }
  }, [user?.id]);

  const loadVendorProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await ProductService.getProductsByVendor(user.id);
      if (error) {
        console.error('Error loading vendor products:', error);
        toast({
          title: "Error",
          description: `Failed to load products: ${error.message || error}`,
          variant: "destructive"
        });
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Exception loading vendor products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadVendorOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await OrderService.getVendorOrders(user.id);
      setOrders(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUploadFormChange = (field: string, value: string | File | null) => {
    setUploadForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (500KB limit)
      if (file.size > 500 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 500KB",
          variant: "destructive"
        });
        return;
      }
      handleUploadFormChange('image', file);
      handleUploadFormChange('imageUrl', ''); // Clear URL if file is selected
    }
  };

  const handleProductUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!uploadForm.name || !uploadForm.category || !uploadForm.price || !uploadForm.stock_quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate image (either file or URL)
    if (!uploadForm.image && !uploadForm.imageUrl) {
      toast({
        title: "Error",
        description: "Please provide either an image file or image URL.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      let mainImage = '';
      
      // Handle image upload
      if (uploadForm.image) {
        const uploadResult = await ImageUploadService.uploadImage(uploadForm.image, 'products');
        if (uploadResult.error) {
          toast({
            title: "Image Upload Failed",
            description: uploadResult.error,
            variant: "destructive"
          });
          return;
        }
        mainImage = uploadResult.url;
      } else if (uploadForm.imageUrl) {
        mainImage = uploadForm.imageUrl;
      }

      // Create product object
      const newProduct = {
        name: uploadForm.name,
        description: uploadForm.description,
        price: parseFloat(uploadForm.price),
        category: uploadForm.category,
        stock_quantity: parseInt(uploadForm.stock_quantity),
        brand: uploadForm.brand,
        main_image: mainImage,
        images: [mainImage],
        pickup_location: uploadForm.pickup_location,
        pickup_phone_number: uploadForm.pickup_phone_number,
        vendor_id: user.id,
        is_active: true,
        rating: 0,
        review_count: 0,
        is_featured: false,
        currency: 'KES'
      };

      // Save to database
      const { data, error } = await ProductService.createProduct(newProduct);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to create product",
          variant: "destructive"
        });
        return;
      }

      // Reset form and reload products
      setUploadForm({
        name: "",
        description: "",
        category: "",
        price: "",
        stock_quantity: "",
        brand: "",
        pickup_location: "",
        pickup_phone_number: "",
        image: null,
        imageUrl: ""
      });
      
      await loadVendorProducts();
      
      toast({
        title: "Success!",
        description: "Product uploaded successfully.",
      });
      
      setActiveTab('products');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload product",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const { error } = await ProductService.deleteProduct(productId);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive"
        });
        return;
      }

      await loadVendorProducts();
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  // Vendors who reach this dashboard are already approved
  const isVerified = true;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-0 sm:h-16 space-y-2 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Vendor Dashboard</h1>
              <span className="text-xs sm:text-sm text-gray-500">Welcome, {user?.name}</span>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                <span className="text-xs sm:text-sm text-green-600 font-medium">Approved Vendor</span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onLogout}
              className="flex items-center space-x-2 w-full sm:w-auto"
              size="sm"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:space-x-1 bg-gray-100 p-1 rounded-lg mb-4 sm:mb-6 w-full sm:w-fit">
          <Button
            variant={activeTab === 'products' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('products')}
            className="flex items-center justify-center space-x-2 mb-1 sm:mb-0"
            disabled={!isVerified}
            size="sm"
          >
            <Package className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Products</span>
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('orders')}
            className="flex items-center justify-center space-x-2 mb-1 sm:mb-0"
            disabled={!isVerified}
            size="sm"
          >
            <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Orders</span>
          </Button>
          <Button
            variant={activeTab === 'upload' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('upload')}
            className="flex items-center justify-center space-x-2"
            disabled={!isVerified}
            size="sm"
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm">Upload Product</span>
          </Button>
        </div>

        {/* Content sections */}
        {isVerified ? (
          <>
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Products</h2>
                  <Button onClick={() => setActiveTab('upload')} className="flex items-center justify-center space-x-2 w-full sm:w-auto" size="sm">
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">Add Product</span>
                  </Button>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="ml-2">Loading products...</span>
                  </div>
                ) : products.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
                    <p className="text-gray-600 mb-4">Start by uploading your first product</p>
                    <Button onClick={() => setActiveTab('upload')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Product
                    </Button>
                  </Card>
                ) : (
                  <VendorProductManagement user={user} />
                )}
              </div>
            )}

            {/* Upload Product Tab */}
            {activeTab === 'upload' && (
              <VendorProductManagement user={user} />
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Orders</h2>
                
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="ml-2">Loading orders...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <Card className="p-8 text-center">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600">Orders will appear here when customers purchase your products</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-gray-900">
                                Order #{order.order_number}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Customer: {order.customer_email}
                              </p>
                              <p className="text-sm text-gray-600">
                                Date: {new Date(order.created_at || '').toLocaleDateString()}
                              </p>
                              <p className="text-sm text-gray-600">
                                Items: {order.order_items?.length || 0}
                              </p>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-lg font-bold text-green-600">
                                {order.currency || 'KES'} {order.total_amount?.toLocaleString()}
                              </p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                          
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <h4 className="text-sm font-medium text-gray-900">Order Items:</h4>
                              {order.order_items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm text-gray-600">
                                  <span>{item.product_name} x {item.quantity}</span>
                                  <span>{order.currency || 'KES'} {item.total_price?.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              <Eye className="w-3 h-3 mr-1" />
                              View Details
                            </Button>
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              Update Status
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Under Review</h3>
            <p className="text-gray-600">
              Your vendor account is currently being reviewed. You'll be able to access all features once approved.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
