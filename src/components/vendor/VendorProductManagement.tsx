import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Eye } from "lucide-react";
import { Product } from "@/types/product";

interface VendorProductManagementProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onView: (product: Product) => void;
}

const VendorProductManagement = ({ products, onEdit, onDelete, onView }: VendorProductManagementProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <div className="aspect-square relative overflow-hidden">
            <img 
              src={product.main_image || '/placeholder.svg'} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {!product.is_active && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white font-semibold">Inactive</span>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
            <p className="text-sm text-gray-600 truncate">{product.category}</p>
            <p className="text-lg font-bold text-green-600 mt-2">
              {product.currency || 'KES'} {product.price?.toLocaleString()}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">
                Stock: {product.stock_quantity || 0}
              </span>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(product)}
                  className="p-1 h-7 w-7"
                >
                  <Eye className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(product)}
                  className="p-1 h-7 w-7"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(product.id)}
                  className="p-1 h-7 w-7 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VendorProductManagement;