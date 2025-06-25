
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Package, ShoppingCart, Edit, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

interface Order {
  id: number;
  customerName: string;
  product: string;
  quantity: number;
  total: number;
  status: 'pending' | 'shipped' | 'delivered';
  date: string;
}

const VendorDashboard = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "African Print Dress",
      price: 45,
      category: "Fashion",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=200&h=200&fit=crop",
      stock: 15
    },
    {
      id: 2,
      name: "Handcrafted Jewelry",
      price: 28,
      category: "Accessories",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop",
      stock: 8
    }
  ]);

  const [orders] = useState<Order[]>([
    {
      id: 1,
      customerName: "Sarah Johnson",
      product: "African Print Dress",
      quantity: 2,
      total: 90,
      status: 'pending',
      date: '2024-01-15'
    },
    {
      id: 2,
      customerName: "Michael Brown",
      product: "Handcrafted Jewelry",
      quantity: 1,
      total: 28,
      status: 'shipped',
      date: '2024-01-14'
    }
  ]);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    image: '',
    stock: ''
  });

  const categories = ['Fashion', 'Accessories', 'Beauty', 'Home & Living', 'Electronics', 'Health & Wellness'];

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: products.length + 1,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      image: newProduct.image || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop',
      stock: parseInt(newProduct.stock)
    };
    
    setProducts([...products, product]);
    setNewProduct({ name: '', price: '', category: '', image: '', stock: '' });
    setIsAddProductOpen(false);
    toast.success("Product added successfully!");
  };

  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
    toast.success("Product deleted successfully!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'shipped': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src="/lovable-uploads/ea738f8c-13db-4727-a9cd-4e4770a84d3b.png" alt="ISA Logo" className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">$</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${orders.reduce((sum, order) => sum + order.total, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>My Products</CardTitle>
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                      <Label htmlFor="productName">Product Name</Label>
                      <Input 
                        id="productName"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input 
                        id="price"
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <select 
                        id="category"
                        className="w-full p-2 border rounded-md"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock Quantity</Label>
                      <Input 
                        id="stock"
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="image">Image URL (Optional)</Label>
                      <Input 
                        id="image"
                        type="url"
                        value={newProduct.image}
                        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                      Add Product
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-1">{product.category}</p>
                  <p className="text-orange-500 font-bold mb-2">${product.price}</p>
                  <p className="text-sm text-gray-500 mb-3">Stock: {product.stock}</p>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders Section */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Order ID</th>
                    <th className="text-left py-2">Customer</th>
                    <th className="text-left py-2">Product</th>
                    <th className="text-left py-2">Quantity</th>
                    <th className="text-left py-2">Total</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b">
                      <td className="py-3">#{order.id}</td>
                      <td className="py-3">{order.customerName}</td>
                      <td className="py-3">{order.product}</td>
                      <td className="py-3">{order.quantity}</td>
                      <td className="py-3">${order.total}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDashboard;
