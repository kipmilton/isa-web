import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Upload, 
  Image as ImageIcon,
  Package,
  DollarSign,
  Star,
  TrendingUp,
  AlertCircle,
  Crown
} from "lucide-react";
import { Product, ProductAttribute, ProductImage } from "@/types/product";
import { ProductService } from "@/services/productService";
import { ImageUploadService } from "@/services/imageUploadService";
import { CommissionService, CommissionInfo } from "@/services/commissionService";
import { useToast } from "@/hooks/use-toast";
import { useConfetti } from "@/contexts/ConfettiContext";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import ImageUpload from "./ImageUpload";
import ProductAttributes from "./ProductAttributes";
import LocationSelect from "@/components/auth/LocationSelect";


interface VendorProductManagementProps {
  user: any;
  isFullPage?: boolean;
}

  interface ProductFormData {
    name: string;
    description: string;
    price: number;
    original_price?: number;
    category: string;
    subcategory?: string;
    brand?: string;
    brand_level?: "entry" | "medium" | "high";
    stock_quantity: number;
    sku?: string;
    tags: string[];
    specifications: Record<string, any>;
    is_featured: boolean;
    is_active: boolean;
    main_image?: string;
    images?: string[];
    commission_percentage?: number;
    pickup_location?: string;
    pickup_phone_number?: string;
    pickup_county?: string;
    pickup_constituency?: string;
    pickup_ward?: string;
    status?: "pending" | "approved" | "rejected";
    rejection_reason?: string | null;
    return_eligible?: boolean;
    return_policy_guidelines?: string;
    return_policy_reason?: string;
    // New fields
    weight_kg?: number;
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
    warranty_period?: number;
    warranty_unit?: 'months' | 'years';
    has_warranty?: boolean;
    delivery_methods?: string[];
    materials?: string[];
    // Extended electronics fields
    display_resolution?: string;
    display_size_inch?: number;
    hdd_size?: string;
    memory_capacity_gb?: number;
    modem_type?: string;
    mount_type?: string;
    plug_type?: string;
    system_memory?: string;
    voltage?: string;
    battery_capacity_mah?: number;
    connection_gender?: string;
    cpu_manufacturer?: string;
    graphics_memory_gb?: number;
    memory_technology?: string;
    panel_type?: string;
    processor_type?: string;
    storage_capacity_gb?: number;
  }

// 1. Add the full category tree and types at the top
export interface CategoryNode {
  name: string;
  sub?: CategoryNode[];
  extraFields?: string[];
}

export const CATEGORY_TREE: CategoryNode[] = [
  { name: "Electronics", sub: [
    { name: "Mobile Phones & Tablets", sub: [
      { name: "Smartphones" },
      { name: "Feature Phones" },
      { name: "Tablets" },
      { name: "Phone Accessories", sub: [
        { name: "Chargers" },
        { name: "Cases & Covers" },
        { name: "Screen Protectors" },
        { name: "Power Banks" }
      ] }
    ] },
    { name: "Computers & Laptops", sub: [
      { name: "Laptops" },
      { name: "Desktop Computers" },
      { name: "Computer Accessories" }
    ] },
    { name: "Audio & Video", sub: [
      { name: "Headphones" },
      { name: "Speakers" },
      { name: "TVs & Monitors" }
    ] },
    { name: "Gaming", sub: [
      { name: "Gaming Consoles" },
      { name: "Gaming Accessories" }
    ] }
  ], extraFields: ["RAM", "Storage", "Processor", "Display Size"] },
  { name: "Fashion", sub: [
    { name: "Men's Clothing", sub: [
      { name: "T-Shirts" }, { name: "Shirts" }, { name: "Jeans" }, { name: "Pants" }, { name: "Jackets" }, { name: "Suits" }
    ] },
    { name: "Women's Clothing", sub: [
      { name: "Dresses" }, { name: "Tops" }, { name: "Skirts" }, { name: "Jeans" }, { name: "Pants" }, { name: "Jackets" }
    ] },
    { name: "Shoes", sub: [
      { name: "Men's Shoes" }, { name: "Women's Shoes" }, { name: "Sports Shoes" }
    ] },
    { name: "Accessories", sub: [
      { name: "Bags" }, { name: "Watches" }, { name: "Jewelry" }, { name: "Belts" }
    ] }
  ] },
  { name: "Swimwear", sub: [
    { name: "Women's Swimwear", sub: [
      { name: "One-Piece Swimsuits" }, { name: "Bikinis" }, { name: "Tankinis" }, { name: "Swim Dresses" }, { name: "Cover-ups & Sarongs" }, { name: "Plus Size Swimwear" }, { name: "Maternity Swimwear" }
    ] },
    { name: "Men's Swimwear", sub: [
      { name: "Swim Trunks" }, { name: "Board Shorts" }, { name: "Briefs" }, { name: "Jammers" }
    ] },
    { name: "Kids' Swimwear", sub: [
      { name: "Girls' Swimsuits" }, { name: "One-Piece" }, { name: "Two-Piece" }, { name: "Boys' Swimsuits" }, { name: "Swim Shorts" }, { name: "Rash Guards" }, { name: "Swim Diapers" }
    ] },
    { name: "Accessories", sub: [
      { name: "Swimming Goggles" }, { name: "Swim Caps" }, { name: "Beach Towels" }, { name: "Flip-Flops" }, { name: "Swim Bags" }, { name: "UV Protection Swimwear" }
    ] }
  ] },
  { name: "Home & Garden", sub: [
    { name: "Furniture", sub: [
      { name: "Living Room" }, { name: "Bedroom" }, { name: "Kitchen & Dining" }, { name: "Office" }
    ] },
    { name: "Decor", sub: [
      { name: "Wall Art" }, { name: "Cushions & Throws" }, { name: "Vases & Planters" }
    ] },
    { name: "Kitchen", sub: [
      { name: "Cookware" }, { name: "Small Appliances" }, { name: "Kitchen Accessories" }
    ] },
    { name: "Garden", sub: [
      { name: "Plants" }, { name: "Garden Tools" }, { name: "Outdoor Furniture" }
    ] }
  ] },
  { name: "Sports & Outdoors", sub: [
    { name: "Fitness", sub: [
      { name: "Gym Equipment" }, { name: "Yoga & Pilates" }, { name: "Running" }
    ] },
    { name: "Team Sports", sub: [
      { name: "Football" }, { name: "Basketball" }, { name: "Cricket" }
    ] },
    { name: "Outdoor Activities", sub: [
      { name: "Camping" }, { name: "Hiking" }, { name: "Cycling" }
    ] },
    { name: "Water Sports", sub: [
      { name: "Swimming" }, { name: "Fishing" }
    ] }
  ] },
  { name: "Books & Media", sub: [
    { name: "Books", sub: [
      { name: "Fiction" }, { name: "Non-Fiction" }, { name: "Academic" }, { name: "Children's Books" }
    ] },
    { name: "Music", sub: [
      { name: "CDs" }, { name: "Vinyl Records" }
    ] },
    { name: "Movies & TV", sub: [
      { name: "DVDs" }, { name: "Blu-rays" }
    ] },
    { name: "Gaming", sub: [
      { name: "Video Games" }, { name: "Board Games" }
    ] }
  ] },
  { name: "Toys & Games", sub: [
    { name: "Educational Toys", sub: [
      { name: "STEM Toys" }, { name: "Learning Toys" }
    ] },
    { name: "Action Figures", sub: [
      { name: "Superheroes" }, { name: "Anime & Manga" }
    ] },
    { name: "Dolls", sub: [
      { name: "Fashion Dolls" }, { name: "Baby Dolls" }
    ] },
    { name: "Building Sets", sub: [
      { name: "LEGO" }, { name: "Other Building Sets" }
    ] },
    { name: "Arts & Crafts", sub: [
      { name: "Drawing & Painting" }, { name: "Craft Kits" }
    ] },
    { name: "Outdoor Toys", sub: [
      { name: "Ride-On Toys" }, { name: "Play Equipment" }
    ] }
  ] },
  { name: "Health & Wellness", sub: [
    { name: "Vitamins & Supplements", sub: [
      { name: "Multivitamins" }, { name: "Protein Supplements" }, { name: "Herbal Supplements" }
    ] },
    { name: "Medical Devices", sub: [
      { name: "Blood Pressure Monitors" }, { name: "Thermometers" }, { name: "First Aid" }
    ] },
    { name: "Fitness Equipment", sub: [
      { name: "Cardio Equipment" }, { name: "Strength Training" }, { name: "Yoga Equipment" }
    ] },
    { name: "Personal Care", sub: [
      { name: "Hair Removal" }, { name: "Oral Care" }, { name: "Skin Care" }
    ] }
  ] },
  { name: "Baby & Kids", sub: [
    { name: "Baby Clothing", sub: [
      { name: "Newborn (0-3 months)" }, { name: "3-6 months" }, { name: "6-12 months" }, { name: "12-24 months" }
    ] },
    { name: "Kids Clothing", sub: [
      { name: "Boys (2-8 years)" }, { name: "Girls (2-8 years)" }, { name: "Boys (8-16 years)" }, { name: "Girls (8-16 years)" }
    ] },
    { name: "Baby Care", sub: [
      { name: "Diapers & Wipes" }, { name: "Baby Food" }, { name: "Baby Bath & Skincare" }
    ] },
    { name: "Baby Gear", sub: [
      { name: "Strollers" }, { name: "Car Seats" }, { name: "High Chairs" }
    ] },
    { name: "Toys", sub: [
      { name: "Baby Toys" }, { name: "Educational Toys" }, { name: "Outdoor Toys" }
    ] }
  ] },
  { name: "Pet Supplies", sub: [
    { name: "Dogs", sub: [
      { name: "Food" }, { name: "Toys" }, { name: "Grooming" }, { name: "Health & Care" }
    ] },
    { name: "Cats", sub: [
      { name: "Food" }, { name: "Toys" }, { name: "Grooming" }, { name: "Health & Care" }
    ] },
    { name: "Other Pets", sub: [
      { name: "Birds" }, { name: "Fish" }, { name: "Small Animals" }
    ] },
    { name: "Pet Accessories", sub: [
      { name: "Beds & Furniture" }, { name: "Collars & Leashes" }, { name: "Carriers & Travel" }
    ] }
  ] },
  { name: "Beauty & Personal Care", sub: [
    { name: "Skincare", sub: [
      { name: "Face Care" }, { name: "Body Care" }, { name: "Sun Care" }
    ] },
    { name: "Makeup", sub: [
      { name: "Face Makeup" }, { name: "Eye Makeup" }, { name: "Lip Makeup" }
    ] },
    { name: "Hair Care", sub: [
      { name: "Shampoo & Conditioner" }, { name: "Hair Styling" }, { name: "Hair Accessories" }
    ] },
    { name: "Fragrances", sub: [
      { name: "Men's Fragrances" }, { name: "Women's Fragrances" }
    ] },
    { name: "Personal Care", sub: [
      { name: "Oral Care" }, { name: "Bath & Body" }
    ] }
  ] },
  { name: "Tools & Home Improvement", sub: [
    { name: "Power Tools" }, { name: "Hand Tools" }, { name: "Plumbing Supplies" }, { name: "Electrical Fixtures" }, { name: "Paint & Wall Treatments" }
  ] },
  { name: "Automotive", sub: [
    { name: "Car Parts", sub: [
      { name: "Engine Parts" }, { name: "Brake System" }, { name: "Suspension" }, { name: "Electrical" }
    ] },
    { name: "Car Accessories", sub: [
      { name: "Interior" }, { name: "Exterior" }, { name: "Audio & Video" }
    ] },
    { name: "Motorcycle Parts", sub: [
      { name: "Engine Parts" }, { name: "Body Parts" }, { name: "Accessories" }
    ] },
    { name: "Tools & Equipment", sub: [
      { name: "Hand Tools" }, { name: "Power Tools" }, { name: "Diagnostic Tools" }
    ] }
  ] },
  { name: "Travel & Luggage", sub: [
    { name: "Suitcases" }, { name: "Travel Backpacks" }, { name: "Duffel Bags" }, { name: "Travel Accessories" }
  ] },
  { name: "Groceries", sub: [
    { name: "Beverages", sub: [
      { name: "Water" }, { name: "Juice" }, { name: "Soft Drinks" }
    ] },
    { name: "Dry Foods", sub: [
      { name: "Rice" }, { name: "Pasta" }, { name: "Cereals" }, { name: "Snacks" }
    ] },
    { name: "Spices & Condiments", sub: [
      { name: "Household Essentials" }, { name: "Tissue Paper" }, { name: "Detergents" }, { name: "Cleaning Products" }
    ] }
  ] },
  { name: "Office & Industrial", sub: [
    { name: "Office Furniture" }, { name: "Printers & Toners" }, { name: "Office Electronics" }, { name: "Packaging Materials" }, { name: "Safety & Security Equipment" }
  ] },
  { name: "Alcoholic Beverages", sub: [
    { name: "Beer", sub: [
      { name: "Lager" }, { name: "Stout" }, { name: "Ale" }, { name: "Craft Beer" }, { name: "Non-Alcoholic Beer" }
    ] },
    { name: "Wine", sub: [
      { name: "Red Wine" }, { name: "Merlot" }, { name: "Cabernet Sauvignon" }, { name: "Shiraz" }, { name: "White Wine" }, { name: "Chardonnay" }, { name: "Sauvignon Blanc" }, { name: "Rosé Wine" }, { name: "Sparkling Wine" }, { name: "Champagne" }, { name: "Prosecco" }, { name: "Fortified Wine" }, { name: "Port" }, { name: "Sherry" }
    ] },
    { name: "Spirits", sub: [
      { name: "Whisky" }, { name: "Scotch Whisky" }, { name: "Bourbon" }, { name: "Irish Whiskey" }, { name: "Vodka" }, { name: "Gin" }
    ] },
    { name: "Alcohol Gift Sets & Accessories", sub: [
      { name: "Gift Packs (Assorted)" }, { name: "Wine Openers" }, { name: "Hip Flasks" }, { name: "Whiskey Stones" }, { name: "Bar Sets & Glassware" }
    ] }
  ] }
];

const VendorProductManagement = ({ user, isFullPage = false }: VendorProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const { toast } = useToast();
  const { triggerConfetti } = useConfetti();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const handleAddProduct = () => {
    if (isFullPage) {
      setShowAddDialog(true);
    } else {
      // Navigate to store section
      window.location.href = '/vendor-dashboard?section=store';
    }
  };

  const handlePickupLocationChange = (county: string, constituency: string, ward?: string) => {
    setPickupLocation({ county, constituency, ward: ward || "" });
    setFormData(prev => ({ 
      ...prev, 
      pickup_county: county, 
      pickup_constituency: constituency, 
      pickup_ward: ward || "",
      pickup_location: ward 
        ? `${county}, ${constituency}, ${ward}`
        : `${county}, ${constituency}`
    }));
  };
  const [banReasonDialogOpen, setBanReasonDialogOpen] = useState(false);
  const [banReasonText, setBanReasonText] = useState("");
  const [statusFilter, setStatusFilter] = useState('All');
  const [pickupLocation, setPickupLocation] = useState({ county: "", constituency: "", ward: "" });

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    original_price: 0,
    category: "",
    subcategory: "",
    brand: "",
    brand_level: "entry",
    stock_quantity: 0,
    sku: "",
    tags: [],
    specifications: {},
    is_featured: false,
    is_active: true,
    main_image: "",
    images: [],
    commission_percentage: undefined,
    pickup_location: "",
    pickup_phone_number: "",
    pickup_county: "",
    pickup_constituency: "",
    pickup_ward: "",
    return_eligible: true,
    return_policy_guidelines: "",
    return_policy_reason: "",
    weight_kg: undefined,
    length_cm: undefined,
    width_cm: undefined,
    height_cm: undefined,
    warranty_period: undefined,
    warranty_unit: undefined,
    has_warranty: false,
    delivery_methods: [],
    materials: []
  });

  const [productAttributes, setProductAttributes] = useState<Omit<ProductAttribute, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]>([]);
  const [productImages, setProductImages] = useState<Omit<ProductImage, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]>([]);


  const [tagInput, setTagInput] = useState("");

  // 2. Replace category state with cascading selection state
  const [mainCategory, setMainCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [subSubCategory, setSubSubCategory] = useState<string>("");
  const [extraFields, setExtraFields] = useState<{ [key: string]: string }>({});

  // Commission-related state
  const [commissionInfo, setCommissionInfo] = useState<CommissionInfo | null>(null);
  const [showCommissionInfo, setShowCommissionInfo] = useState(false);

  // 3. Helper to get subcategories for a given main category
  const getSubcategories = (main: string) => {
    const node = CATEGORY_TREE.find(cat => cat.name === main);
    return node?.sub || [];
  };
  const getSubSubcategories = (main: string, sub: string) => {
    const node = CATEGORY_TREE.find(cat => cat.name === main)?.sub?.find(s => s.name === sub);
    return node?.sub || [];
  };
  const getExtraFields = (main: string) => {
    const node = CATEGORY_TREE.find(cat => cat.name === main);
    return node?.extraFields || [];
  };

  // Fetch vendor's products
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const result = await ProductService.getProductsByVendor(user.id);
      if (result.error) {
        toast({
          title: "Error",
          description: "Failed to load products",
          variant: "destructive"
        });
      } else {
        setProducts((result.data || []) as Product[]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const result = await ProductService.getCategories();
      if (!result.error) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Calculate commission when category or price changes
  const calculateCommission = async () => {
    if (mainCategory && formData.price > 0) {
      const categoryPath = CommissionService.buildCategoryPath(mainCategory, subCategory, subSubCategory);
      const commission = await CommissionService.getCommissionInfo(user.id, categoryPath, formData.price);
      setCommissionInfo(commission);
    }
  };

  // Update commission when category or price changes
  useEffect(() => {
    calculateCommission();
  }, [mainCategory, subCategory, subSubCategory, formData.price]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !mainCategory) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate minimum 3 images
    if (!formData.images || formData.images.length < 3) {
      toast({
        title: "Validation Error",
        description: "Please upload at least 3 product images",
        variant: "destructive"
      });
      return;
    }

    try {
      const productData = {
        ...formData,
        vendor_id: user.id,
        price: parseFloat(formData.price.toString()),
        original_price: formData.original_price ? parseFloat(formData.original_price.toString()) : undefined,
        stock_quantity: parseInt(formData.stock_quantity.toString()),
        main_category: mainCategory,
        category: mainCategory,
        subcategory: subCategory,
        sub_subcategory: subSubCategory,
        status: 'pending' as const,
        ...(mainCategory === 'Electronics' ? {
          ram: extraFields['RAM'] || null,
          storage: extraFields['Storage'] || null,
          processor: extraFields['Processor'] || null,
          display_size: extraFields['Display Size'] || null,
        } : {}),
        rating: 0,
        review_count: 0,
        location_lat: null,
        location_lng: null,
        location_address: formData.pickup_location,
        pickup_county: formData.pickup_county,
        pickup_constituency: formData.pickup_constituency,
        pickup_ward: formData.pickup_ward,
        // Convert arrays to JSONB-compatible format
        delivery_methods: formData.delivery_methods || [],
        materials: formData.materials || [],
      };

      let productId: string;

      if (editingProduct) {
        // If rejected, set status back to pending and clear rejection_reason
        const updates = { 
          ...productData,
          status: editingProduct.status === 'rejected' ? 'pending' : productData.status,
          rejection_reason: editingProduct.status === 'rejected' ? null : productData.rejection_reason
        };
        const result = await ProductService.updateProduct(editingProduct.id, updates, user.id);
        if (result.error) {
          throw new Error(result.error.message);
        }
        productId = editingProduct.id;
        toast({
          title: "Success",
          description: "Product updated and resubmitted for approval"
        });
      } else {
        const result = await ProductService.createProduct(productData);
        if (result.error) {
          throw new Error(result.error.message);
        }
        productId = result.data[0].id;
        // Trigger confetti celebration for product creation
        triggerConfetti({
          duration: 3500,
          particleCount: 120,
          colors: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4']
        });

        toast({
          title: "Success",
          description: "Product created successfully"
        });
      }

      // Save product attributes if it's a fashion item
      if (mainCategory === 'Fashion' && productAttributes.length > 0) {
        await ProductService.updateProductAttributes(productId, productAttributes);
      }

      // Save product images with descriptions
      if (productImages.length > 0) {
        await ProductService.updateProductImages(productId, productImages);
      }

      setShowAddDialog(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      original_price: product.original_price,
      category: product.category,
      subcategory: product.subcategory || "",
      brand: product.brand || "",
      stock_quantity: product.stock_quantity || 0,
      sku: product.sku || "",
      tags: product.tags || [],
      specifications: product.specifications || {},
      is_featured: product.is_featured || false,
      is_active: product.is_active !== undefined ? product.is_active : true,
      main_image: product.main_image,
      images: product.images || [],
      commission_percentage: product.commission_percentage,
      pickup_location: product.pickup_location || "",
      pickup_phone_number: product.pickup_phone_number || "",
      pickup_county: product.pickup_county || "",
      pickup_constituency: product.pickup_constituency || "",
      pickup_ward: product.pickup_ward || ""
    });

    setMainCategory(product.category);
    setSubCategory(product.subcategory || "");
    setShowAddDialog(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const result = await ProductService.deleteProduct(productId);
      if (result.error) {
        throw new Error(result.error.message);
      }
      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      original_price: 0,
      category: "",
      subcategory: "",
      brand: "",
      stock_quantity: 0,
      sku: "",
      tags: [],
      specifications: {},
      is_featured: false,
      is_active: true,
      main_image: "",
      images: [],
      commission_percentage: undefined,
      pickup_location: "",
      pickup_phone_number: "",
      pickup_county: "",
      pickup_constituency: "",
      pickup_ward: ""
    });
    
    setTagInput("");
    setMainCategory("");
    setSubCategory("");
    setSubSubCategory("");
    setExtraFields({});
    setProductAttributes([]);
    setProductImages([]);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle image upload
  const handleImageUpload = (result: any) => {
    if (result.error) {
      toast({
        title: "Upload Failed",
        description: result.error,
        variant: "destructive"
      });
      return;
    }

    // Set as main image if no main image exists
    if (!formData.main_image) {
      setFormData(prev => ({ ...prev, main_image: result.url }));
    }

    // Add to images array
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), result.url]
    }));

    // Add to product images with description
    const newImage: Omit<ProductImage, 'id' | 'product_id' | 'created_at' | 'updated_at'> = {
      image_url: result.url,
      image_description: `Image ${productImages.length + 1}`,
      display_order: productImages.length,
      is_main_image: productImages.length === 0
    };

    setProductImages(prev => [...prev, newImage]);
  };

  // Handle image removal
  const handleImageRemove = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter(img => img !== imageUrl) || [],
      main_image: prev.main_image === imageUrl ? "" : prev.main_image
    }));

    setProductImages(prev => prev.filter(img => img.image_url !== imageUrl));
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesStatus = statusFilter === 'All' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price).replace('KSh', 'Ksh');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Only show when not in full page mode */}
        {!isFullPage && (
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Management</h1>
                <p className="text-gray-600 text-sm sm:text-base">Manage your product catalog</p>
              </div>
              <Button onClick={handleAddProduct} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">Total Products</p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{products.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">Active Products</p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{products.filter(p => p.is_active).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">Featured</p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{products.filter(p => p.is_featured).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
                  <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-600">Out of Stock</p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{products.filter(p => (p.stock_quantity || 0) === 0).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm sm:text-base"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {CATEGORY_TREE.map(category => (
                  <SelectItem key={category.name} value={category.name}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        )}

        {/* Show form directly when in full page mode */}
        {isFullPage && (
          <div className="mb-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter product name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          value={formData.brand}
                          onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                          placeholder="Enter brand name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="brand_level">Brand Level</Label>
                      <Select value={formData.brand_level || "entry"} onValueChange={(value: "entry" | "medium" | "high") => setFormData(prev => ({ ...prev, brand_level: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level - Budget-friendly products</SelectItem>
                          <SelectItem value="medium">Medium Level - Mid-range quality</SelectItem>
                          <SelectItem value="high">High Level - Premium/Luxury products</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter product description"
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label>Main Category *</Label>
                      <Select value={mainCategory} onValueChange={(value) => {
                        setMainCategory(value);
                        setSubCategory("");
                        setSubSubCategory("");
                        setFormData(prev => ({ ...prev, category: value }));
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Main Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_TREE.map(cat => (
                            <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {mainCategory && getSubcategories(mainCategory).length > 0 && (
                      <div>
                        <Label>Subcategory</Label>
                        <Select value={subCategory} onValueChange={(value) => {
                          setSubCategory(value);
                          setSubSubCategory("");
                          setFormData(prev => ({ ...prev, subcategory: value }));
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {getSubcategories(mainCategory).map(sub => (
                              <SelectItem key={sub.name} value={sub.name}>{sub.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {mainCategory && subCategory && getSubSubcategories(mainCategory, subCategory).length > 0 && (
                      <div>
                        <Label>Sub-Subcategory</Label>
                        <Select value={subSubCategory} onValueChange={(value) => {
                          setSubSubCategory(value);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Sub-Subcategory" />
                          </SelectTrigger>
                          <SelectContent>
                            {getSubSubcategories(mainCategory, subCategory).map(subsub => (
                              <SelectItem key={subsub.name} value={subsub.name}>{subsub.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {mainCategory === 'Electronics' && getExtraFields(mainCategory).length > 0 && (
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Basic Electronics Specifications</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {getExtraFields(mainCategory).map(field => (
                            <div key={field}>
                              <Label>{field}</Label>
                              <Input
                                type="text"
                                value={extraFields[field] || ''}
                                onChange={e => setExtraFields(prev => ({ ...prev, [field]: e.target.value }))}
                                placeholder={`Enter ${field}`}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Extended Electronics Specifications */}
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Advanced Electronics Specifications</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="display_resolution" className="text-xs">Display Resolution</Label>
                              <Input
                                id="display_resolution"
                                value={formData.display_resolution || ""}
                                onChange={e => setFormData(prev => ({ ...prev, display_resolution: e.target.value }))}
                                placeholder="e.g., 1080p, 4K"
                              />
                            </div>
                            <div>
                              <Label htmlFor="display_size_inch" className="text-xs">Display Size (inches)</Label>
                              <Input
                                id="display_size_inch"
                                type="number"
                                step="0.1"
                                value={formData.display_size_inch || ""}
                                onChange={e => setFormData(prev => ({ ...prev, display_size_inch: parseFloat(e.target.value) || undefined }))}
                                placeholder="e.g., 55"
                              />
                            </div>
                            <div>
                              <Label htmlFor="hdd_size" className="text-xs">HDD Size</Label>
                              <Input
                                id="hdd_size"
                                value={formData.hdd_size || ""}
                                onChange={e => setFormData(prev => ({ ...prev, hdd_size: e.target.value }))}
                                placeholder="e.g., 1 TB"
                              />
                            </div>
                            <div>
                              <Label htmlFor="memory_capacity_gb" className="text-xs">Memory Capacity (GB)</Label>
                              <Input
                                id="memory_capacity_gb"
                                type="number"
                                value={formData.memory_capacity_gb || ""}
                                onChange={e => setFormData(prev => ({ ...prev, memory_capacity_gb: parseInt(e.target.value) || undefined }))}
                                placeholder="e.g., 16"
                              />
                            </div>
                            <div>
                              <Label htmlFor="system_memory" className="text-xs">System Memory</Label>
                              <Input
                                id="system_memory"
                                value={formData.system_memory || ""}
                                onChange={e => setFormData(prev => ({ ...prev, system_memory: e.target.value }))}
                                placeholder="e.g., 8 GB"
                              />
                            </div>
                            <div>
                              <Label htmlFor="storage_capacity_gb" className="text-xs">Storage Capacity (GB)</Label>
                              <Input
                                id="storage_capacity_gb"
                                type="number"
                                value={formData.storage_capacity_gb || ""}
                                onChange={e => setFormData(prev => ({ ...prev, storage_capacity_gb: parseInt(e.target.value) || undefined }))}
                                placeholder="e.g., 256"
                              />
                            </div>
                            <div>
                              <Label htmlFor="battery_capacity_mah" className="text-xs">Battery Capacity (mAh)</Label>
                              <Input
                                id="battery_capacity_mah"
                                type="number"
                                value={formData.battery_capacity_mah || ""}
                                onChange={e => setFormData(prev => ({ ...prev, battery_capacity_mah: parseInt(e.target.value) || undefined }))}
                                placeholder="e.g., 5000"
                              />
                            </div>
                            <div>
                              <Label htmlFor="cpu_manufacturer" className="text-xs">CPU Manufacturer</Label>
                              <Input
                                id="cpu_manufacturer"
                                value={formData.cpu_manufacturer || ""}
                                onChange={e => setFormData(prev => ({ ...prev, cpu_manufacturer: e.target.value }))}
                                placeholder="e.g., Intel, AMD"
                              />
                            </div>
                            <div>
                              <Label htmlFor="processor_type" className="text-xs">Processor Type</Label>
                              <Input
                                id="processor_type"
                                value={formData.processor_type || ""}
                                onChange={e => setFormData(prev => ({ ...prev, processor_type: e.target.value }))}
                                placeholder="e.g., Core i7"
                              />
                            </div>
                            <div>
                              <Label htmlFor="graphics_memory_gb" className="text-xs">Graphics Memory (GB)</Label>
                              <Input
                                id="graphics_memory_gb"
                                type="number"
                                value={formData.graphics_memory_gb || ""}
                                onChange={e => setFormData(prev => ({ ...prev, graphics_memory_gb: parseInt(e.target.value) || undefined }))}
                                placeholder="e.g., 8"
                              />
                            </div>
                            <div>
                              <Label htmlFor="memory_technology" className="text-xs">Memory Technology</Label>
                              <Select 
                                value={formData.memory_technology || ""} 
                                onValueChange={(value) => setFormData(prev => ({ ...prev, memory_technology: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DDR3">DDR3</SelectItem>
                                  <SelectItem value="DDR4">DDR4</SelectItem>
                                  <SelectItem value="DDR5">DDR5</SelectItem>
                                  <SelectItem value="LPDDR4">LPDDR4</SelectItem>
                                  <SelectItem value="LPDDR5">LPDDR5</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="panel_type" className="text-xs">Panel Type</Label>
                              <Select 
                                value={formData.panel_type || ""} 
                                onValueChange={(value) => setFormData(prev => ({ ...prev, panel_type: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select panel type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="IPS">IPS</SelectItem>
                                  <SelectItem value="VA">VA</SelectItem>
                                  <SelectItem value="TN">TN</SelectItem>
                                  <SelectItem value="OLED">OLED</SelectItem>
                                  <SelectItem value="AMOLED">AMOLED</SelectItem>
                                  <SelectItem value="LCD">LCD</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="plug_type" className="text-xs">Plug Type</Label>
                              <Select 
                                value={formData.plug_type || ""} 
                                onValueChange={(value) => setFormData(prev => ({ ...prev, plug_type: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Type-C">Type-C</SelectItem>
                                  <SelectItem value="USB-A">USB-A</SelectItem>
                                  <SelectItem value="Lightning">Lightning</SelectItem>
                                  <SelectItem value="Micro-USB">Micro-USB</SelectItem>
                                  <SelectItem value="Mini-USB">Mini-USB</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="voltage" className="text-xs">Voltage</Label>
                              <Input
                                id="voltage"
                                value={formData.voltage || ""}
                                onChange={e => setFormData(prev => ({ ...prev, voltage: e.target.value }))}
                                placeholder="e.g., 110V, 220V"
                              />
                            </div>
                            <div>
                              <Label htmlFor="modem_type" className="text-xs">Modem Type</Label>
                              <Input
                                id="modem_type"
                                value={formData.modem_type || ""}
                                onChange={e => setFormData(prev => ({ ...prev, modem_type: e.target.value }))}
                                placeholder="e.g., 4G LTE, 5G"
                              />
                            </div>
                            <div>
                              <Label htmlFor="mount_type" className="text-xs">Mount Type</Label>
                              <Input
                                id="mount_type"
                                value={formData.mount_type || ""}
                                onChange={e => setFormData(prev => ({ ...prev, mount_type: e.target.value }))}
                                placeholder="e.g., VESA, Wall"
                              />
                            </div>
                            <div>
                              <Label htmlFor="connection_gender" className="text-xs">Connection Gender</Label>
                              <Select 
                                value={formData.connection_gender || ""} 
                                onValueChange={(value) => setFormData(prev => ({ ...prev, connection_gender: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Unisex">Unisex</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Product Attributes for Fashion */}
                    {mainCategory === 'Fashion' && (
                      <ProductAttributes
                        category={mainCategory}
                        subcategory={subCategory}
                        attributes={productAttributes as any}
                        onAttributesChange={setProductAttributes}
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sku">SKU (Auto-generated)</Label>
                        <Input
                          id="sku"
                          value={formData.sku || "Will be auto-generated"}
                          disabled
                          placeholder="Auto-generated on save"
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground mt-1">SKU is automatically generated when you save the product</p>
                      </div>
                      <div>
                        <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                        <Input
                          id="stock_quantity"
                          type="number"
                          min={0}
                          value={formData.stock_quantity}
                          onChange={e => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                          required
                        />
                      </div>
                    </div>

                    {/* Product Dimensions and Weight */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Product Dimensions & Weight</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label htmlFor="length_cm" className="text-xs">Length (cm)</Label>
                          <Input
                            id="length_cm"
                            type="number"
                            step="0.01"
                            min={0}
                            value={formData.length_cm || ""}
                            onChange={e => setFormData(prev => ({ ...prev, length_cm: parseFloat(e.target.value) || undefined }))}
                            placeholder="L"
                          />
                        </div>
                        <div>
                          <Label htmlFor="width_cm" className="text-xs">Width (cm)</Label>
                          <Input
                            id="width_cm"
                            type="number"
                            step="0.01"
                            min={0}
                            value={formData.width_cm || ""}
                            onChange={e => setFormData(prev => ({ ...prev, width_cm: parseFloat(e.target.value) || undefined }))}
                            placeholder="W"
                          />
                        </div>
                        <div>
                          <Label htmlFor="height_cm" className="text-xs">Height (cm)</Label>
                          <Input
                            id="height_cm"
                            type="number"
                            step="0.01"
                            min={0}
                            value={formData.height_cm || ""}
                            onChange={e => setFormData(prev => ({ ...prev, height_cm: parseFloat(e.target.value) || undefined }))}
                            placeholder="H"
                          />
                        </div>
                        <div>
                          <Label htmlFor="weight_kg" className="text-xs">Weight (kg)</Label>
                          <Input
                            id="weight_kg"
                            type="number"
                            step="0.01"
                            min={0}
                            value={formData.weight_kg || ""}
                            onChange={e => setFormData(prev => ({ ...prev, weight_kg: parseFloat(e.target.value) || undefined }))}
                            placeholder="Weight"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Warranty */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="has_warranty"
                          checked={formData.has_warranty || false}
                          onChange={e => setFormData(prev => ({ ...prev, has_warranty: e.target.checked }))}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="has_warranty" className="text-base font-semibold cursor-pointer">
                          This product has warranty
                        </Label>
                      </div>
                      {formData.has_warranty && (
                        <div className="grid grid-cols-2 gap-3 ml-6">
                          <div>
                            <Label htmlFor="warranty_period" className="text-xs">Duration</Label>
                            <Input
                              id="warranty_period"
                              type="number"
                              min={1}
                              value={formData.warranty_period || ""}
                              onChange={e => setFormData(prev => ({ ...prev, warranty_period: parseInt(e.target.value) || undefined }))}
                              placeholder="Enter number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="warranty_unit" className="text-xs">Unit</Label>
                            <Select 
                              value={formData.warranty_unit || ""} 
                              onValueChange={(value: 'months' | 'years') => setFormData(prev => ({ ...prev, warranty_unit: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="months">Months</SelectItem>
                                <SelectItem value="years">Years</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delivery Methods */}
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">Preferred Delivery Methods</Label>
                      <p className="text-xs text-muted-foreground">Select all applicable delivery methods</p>
                      <div className="space-y-3">
                        {[
                          { value: 'bicycle', label: 'Bicycle Delivery', desc: 'Best for: Very light packages (documents, accessories, small electronics)' },
                          { value: 'motorcycle', label: 'Motorcycle (Boda Boda)', desc: 'Best for: Small to medium parcels, food, fashion, electronics' },
                          { value: 'car', label: 'Private Car / Taxi', desc: 'Best for: Fragile or medium-sized items (flowers, electronics, groceries)' },
                          { value: 'pickup', label: 'Pickup Truck', desc: 'Best for: Bulkier or heavier goods like furniture, electronics' },
                          { value: 'truck', label: 'Light Commercial Truck', desc: 'Best for: Heavy goods — building materials, fridges, beds' },
                          { value: 'lorry', label: 'Lorry / Trailer', desc: 'Best for: Very heavy or bulk shipments — industrial items, pallets' },
                          { value: 'matatu', label: 'Matatu / Bus Parcel Service', desc: 'Best for: Inter-county or rural deliveries' }
                        ].map(method => (
                          <div key={method.value} className="flex items-start space-x-2 border rounded p-3">
                            <input
                              type="checkbox"
                              id={`delivery_${method.value}`}
                              checked={formData.delivery_methods?.includes(method.value) || false}
                              onChange={e => {
                                const checked = e.target.checked;
                                setFormData(prev => ({
                                  ...prev,
                                  delivery_methods: checked
                                    ? [...(prev.delivery_methods || []), method.value]
                                    : (prev.delivery_methods || []).filter(m => m !== method.value)
                                }));
                              }}
                              className="w-4 h-4 mt-1"
                            />
                            <div>
                              <Label htmlFor={`delivery_${method.value}`} className="font-medium cursor-pointer">
                                {method.label}
                              </Label>
                              <p className="text-xs text-muted-foreground">{method.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Materials (for Household items) */}
                    {(mainCategory === 'Home & Lifestyle' || mainCategory === 'Furniture') && (
                      <div className="space-y-2">
                        <Label className="text-base font-semibold">Materials</Label>
                        <p className="text-xs text-muted-foreground">Select all materials used in this product</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['Wood', 'Metal', 'Steel', 'Plastic', 'Glass', 'Fabric', 'Leather', 'Ceramic', 'Stone', 'Other'].map(material => (
                            <div key={material} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`material-${material}`}
                                checked={formData.materials?.includes(material) || false}
                                onChange={(e) => {
                                  const materials = formData.materials || [];
                                  if (e.target.checked) {
                                    setFormData(prev => ({ ...prev, materials: [...materials, material] }));
                                  } else {
                                    setFormData(prev => ({ ...prev, materials: materials.filter(m => m !== material) }));
                                  }
                                }}
                                className="rounded"
                              />
                              <Label htmlFor={`material-${material}`} className="text-sm cursor-pointer">{material}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <Label>Pickup Location *</Label>
                        <LocationSelect 
                          onLocationChange={handlePickupLocationChange} 
                          required 
                          initialLocation={{
                            county: formData.pickup_county || "",
                            constituency: formData.pickup_constituency || "",
                            ward: formData.pickup_ward || ""
                          }}
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          Confirm your pickup location for delivery cost calculation
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="pickup_phone_number">Pickup Phone Number *</Label>
                        <Input
                          id="pickup_phone_number"
                          type="tel"
                          value={formData.pickup_phone_number}
                          onChange={(e) => setFormData(prev => ({ ...prev, pickup_phone_number: e.target.value }))}
                          placeholder="e.g. +254700000000"
                          required
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="pricing" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Now (Current Price) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">Ksh</span>
                          <Input
                            id="price"
                            type="number"
                            min={0}
                            value={formData.price}
                            onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            required
                            placeholder="e.g. 19500"
                            className="pl-14 mb-1"
                          />
                          {formData.price > 0 && commissionInfo && (
                            <div className="text-xs text-gray-600 mt-1">
                              You will receive <span className="font-semibold">Ksh {commissionInfo.vendor_earnings.toFixed(2)}</span>, <span className="font-semibold">Ksh {commissionInfo.isa_commission.toFixed(2)}</span> goes to ISA commission
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="original_price">Was (Original Price)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">Ksh</span>
                          <Input
                            id="original_price"
                            type="number"
                            min={0}
                            value={formData.original_price ?? ''}
                            onChange={e => setFormData(prev => ({ ...prev, original_price: e.target.value ? parseFloat(e.target.value) : undefined }))}
                            placeholder="e.g. 20000"
                            className="pl-14 mb-4"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="commission_percentage">Commission Percentage (%)</Label>
                      <Input
                        id="commission_percentage"
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={formData.commission_percentage ?? ''}
                        onChange={e => setFormData(prev => ({ ...prev, commission_percentage: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        placeholder="e.g. 10 for 10%"
                        className="mb-4"
                      />
                    </div>

                    {commissionInfo && mainCategory && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-800 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Earnings Breakdown
                          </h4>
                          <Badge variant={commissionInfo.plan === 'premium' ? 'default' : 'secondary'} className="flex items-center">
                            <Crown className="w-3 h-3 mr-1" />
                            {commissionInfo.plan === 'premium' ? 'Premium' : 'Freemium'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Product Price:</span>
                            <span className="font-semibold ml-1 text-gray-800">Ksh {formData.price.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">ISA Commission ({commissionInfo.rate}%):</span>
                            <span className="font-semibold ml-1 text-red-600">Ksh {commissionInfo.isa_commission.toFixed(2)}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-600">Your Earnings:</span>
                            <span className="font-semibold ml-1 text-green-600 text-lg">Ksh {commissionInfo.vendor_earnings.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Category: {commissionInfo.category_path}
                        </div>
                        {commissionInfo.plan === 'freemium' && (
                          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-blue-800 flex items-center mb-1">
                                  <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                                  Upgrade to Premium
                                </h5>
                                <p className="text-xs text-blue-700 mb-2">
                                  Reduce commission from {commissionInfo.rate}% down to around 5% and earn more!
                                </p>
                                <div className="text-xs text-blue-600">
                                  <span className="font-semibold">Premium earnings:</span> Ksh {(formData.price * 0.95).toFixed(2)} 
                                  <span className="text-green-600 ml-2">(+Ksh {(formData.price * 0.05).toFixed(2)} more)</span>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs px-3 py-1"
                                onClick={() => {
                                  navigate('/vendor-dashboard?section=subscription');
                                  toast({
                                    title: "Premium Upgrade",
                                    description: "Redirecting to subscription plans...",
                                    variant: "default"
                                  });
                                }}
                              >
                                Upgrade Now
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="media" className="space-y-4">
                    <div>
                      <Label>Product Images (Minimum 3 required)</Label>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload at least 3 product images. The first image will be used as the main product image.
                      </p>
                      <ImageUpload
                        onImageUpload={handleImageUpload}
                        onImageRemove={handleImageRemove}
                        existingImages={formData.images || []}
                        multiple={true}
                        maxImages={5}
                      />
                      {formData.images && formData.images.length < 3 && (
                        <p className="text-sm text-red-600 mt-2">
                          Please upload at least {3 - formData.images.length} more image(s)
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Tags</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          placeholder="Add a tag"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        />
                        <Button type="button" onClick={addTag} variant="outline">
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="advanced" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="featured">Featured Product</Label>
                        <p className="text-sm text-gray-600">Show this product in featured sections</p>
                      </div>
                      <Switch
                        id="featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="active">Active Product</Label>
                        <p className="text-sm text-gray-600">Make this product visible to customers</p>
                      </div>
                      <Switch
                        id="active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>

                    {/* Return Policy Section */}
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="text-lg font-semibold text-gray-900">Return Policy</h3>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="return_eligible">Eligible for Return</Label>
                          <p className="text-sm text-gray-600">Can customers return this item after purchase?</p>
                        </div>
                        <Switch
                          id="return_eligible"
                          checked={formData.return_eligible || false}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, return_eligible: checked }))}
                        />
                      </div>

                      {formData.return_eligible ? (
                        <div>
                          <Label htmlFor="return_policy_guidelines">Return Guidelines</Label>
                          <p className="text-sm text-gray-600 mb-2">Specify the conditions under which the product can be returned</p>
                          <Textarea
                            id="return_policy_guidelines"
                            value={formData.return_policy_guidelines || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, return_policy_guidelines: e.target.value }))}
                            placeholder="e.g., Product must be undamaged, in original packaging, with all accessories included. No signs of wear or use."
                            rows={3}
                          />
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="return_policy_reason">Reason for No Returns</Label>
                          <p className="text-sm text-gray-600 mb-2">Explain why this product cannot be returned</p>
                          <Textarea
                            id="return_policy_reason"
                            value={formData.return_policy_reason || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, return_policy_reason: e.target.value }))}
                            placeholder="e.g., Highly consumable item like perfumes that cannot be resold for hygiene reasons"
                            rows={3}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    if (isFullPage) {
                      resetForm();
                    } else {
                      setShowAddDialog(false);
                      setEditingProduct(null);
                      resetForm();
                    }
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProduct ? "Update Product" : "Create Product"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Grid - Only show when NOT in full page mode */}
        {!isFullPage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm sm:text-base">Loading products...</span>
            </div>
          ) : filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={product.main_image || product.images?.[0] || '/placeholder.svg'}
                    alt={product.name}
                    className="w-full h-40 sm:h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="w-7 h-7 sm:w-8 sm:h-8 bg-white/90 hover:bg-white"
                      onClick={() => handleEdit(product)}
                      disabled={product.status === 'approved' || product.banned}
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500/90 hover:bg-red-500"
                      onClick={() => handleDelete(product.id)}
                      disabled={product.banned}
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.status === 'pending' && (
                      <Badge variant="secondary" className="text-xs">Pending Approval</Badge>
                    )}
                    {product.status === 'approved' && (
                      <Badge variant="default" className="text-xs">Approved</Badge>
                    )}
                    {product.status === 'rejected' && (
                      <Badge variant="destructive" className="text-xs">Rejected</Badge>
                    )}
                    {product.status === 'rejected' && product.rejection_reason && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-400 hover:bg-red-50 text-xs mt-1"
                        onClick={() => {
                          setBanReasonText(product.rejection_reason || "");
                          setBanReasonDialogOpen(true);
                        }}
                      >
                        View Reason
                      </Button>
                    )}
                    {product.banned && (
                      <Badge className="bg-red-600 text-white text-xs">Banned</Badge>
                    )}
                  </div>
                </div>
                
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">{product.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base sm:text-lg font-bold text-gray-900">Ksh {product.price?.toLocaleString()}</span>
                    <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                    <span>Stock: {product.stock_quantity || 0}</span>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span>{(product.rating || 0).toFixed(1)} ({product.review_count || 0})</span>
                    </div>
                  </div>
                  {product.banned && product.banned_reason && (
                    <div className="mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-400 hover:bg-red-50 text-xs"
                        onClick={() => {
                          setBanReasonText(product.banned_reason || "");
                          setBanReasonDialogOpen(true);
                        }}
                      >
                        View Ban Reason
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
           </div>
        )}

        {filteredProducts.length === 0 && !loading && !isFullPage && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {searchQuery || selectedCategory !== "All" 
                ? "Try adjusting your search or filters"
                : "Get started by adding your first product"
              }
            </p>
            {!searchQuery && selectedCategory === "All" && (
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Product Dialog (used only in non-full-page mode) */}
      {!isFullPage && (
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingProduct ? "Edit product information and details." : "Add a new product to your inventory."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Enter brand name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="brand_level">Brand Level</Label>
                  <Select value={formData.brand_level || "entry"} onValueChange={(value: "entry" | "medium" | "high") => setFormData(prev => ({ ...prev, brand_level: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level - Budget-friendly products</SelectItem>
                      <SelectItem value="medium">Medium Level - Mid-range quality</SelectItem>
                      <SelectItem value="high">High Level - Premium/Luxury products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter product description"
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Main Category *</Label>
                  <Select value={mainCategory} onValueChange={(value) => {
                    setMainCategory(value);
                    setSubCategory("");
                    setSubSubCategory("");
                    setFormData(prev => ({ ...prev, category: value }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Main Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_TREE.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {mainCategory && getSubcategories(mainCategory).length > 0 && (
                  <div>
                    <Label>Subcategory</Label>
                    <Select value={subCategory} onValueChange={(value) => {
                      setSubCategory(value);
                      setSubSubCategory("");
                      setFormData(prev => ({ ...prev, subcategory: value }));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubcategories(mainCategory).map(sub => (
                          <SelectItem key={sub.name} value={sub.name}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {mainCategory && subCategory && getSubSubcategories(mainCategory, subCategory).length > 0 && (
                  <div>
                    <Label>Sub-Subcategory</Label>
                    <Select value={subSubCategory} onValueChange={(value) => {
                      setSubSubCategory(value);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Sub-Subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubSubcategories(mainCategory, subCategory).map(subsub => (
                          <SelectItem key={subsub.name} value={subsub.name}>{subsub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {mainCategory === 'Electronics' && getExtraFields(mainCategory).length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Basic Electronics Specifications</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getExtraFields(mainCategory).map(field => (
                        <div key={field}>
                          <Label>{field}</Label>
                          <Input
                            type="text"
                            value={extraFields[field] || ''}
                            onChange={e => setExtraFields(prev => ({ ...prev, [field]: e.target.value }))}
                            placeholder={`Enter ${field}`}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Extended Electronics Specifications */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Advanced Electronics Specifications</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="display_resolution" className="text-xs">Display Resolution</Label>
                          <Input
                            id="display_resolution"
                            value={formData.display_resolution || ""}
                            onChange={e => setFormData(prev => ({ ...prev, display_resolution: e.target.value }))}
                            placeholder="e.g., 1080p, 4K"
                          />
                        </div>
                        <div>
                          <Label htmlFor="display_size_inch" className="text-xs">Display Size (inches)</Label>
                          <Input
                            id="display_size_inch"
                            type="number"
                            step="0.1"
                            value={formData.display_size_inch || ""}
                            onChange={e => setFormData(prev => ({ ...prev, display_size_inch: parseFloat(e.target.value) || undefined }))}
                            placeholder="e.g., 55"
                          />
                        </div>
                        <div>
                          <Label htmlFor="hdd_size" className="text-xs">HDD Size</Label>
                          <Input
                            id="hdd_size"
                            value={formData.hdd_size || ""}
                            onChange={e => setFormData(prev => ({ ...prev, hdd_size: e.target.value }))}
                            placeholder="e.g., 1 TB"
                          />
                        </div>
                        <div>
                          <Label htmlFor="memory_capacity_gb" className="text-xs">Memory Capacity (GB)</Label>
                          <Input
                            id="memory_capacity_gb"
                            type="number"
                            value={formData.memory_capacity_gb || ""}
                            onChange={e => setFormData(prev => ({ ...prev, memory_capacity_gb: parseInt(e.target.value) || undefined }))}
                            placeholder="e.g., 16"
                          />
                        </div>
                        <div>
                          <Label htmlFor="system_memory" className="text-xs">System Memory</Label>
                          <Input
                            id="system_memory"
                            value={formData.system_memory || ""}
                            onChange={e => setFormData(prev => ({ ...prev, system_memory: e.target.value }))}
                            placeholder="e.g., 8 GB"
                          />
                        </div>
                        <div>
                          <Label htmlFor="storage_capacity_gb" className="text-xs">Storage Capacity (GB)</Label>
                          <Input
                            id="storage_capacity_gb"
                            type="number"
                            value={formData.storage_capacity_gb || ""}
                            onChange={e => setFormData(prev => ({ ...prev, storage_capacity_gb: parseInt(e.target.value) || undefined }))}
                            placeholder="e.g., 256"
                          />
                        </div>
                        <div>
                          <Label htmlFor="battery_capacity_mah" className="text-xs">Battery Capacity (mAh)</Label>
                          <Input
                            id="battery_capacity_mah"
                            type="number"
                            value={formData.battery_capacity_mah || ""}
                            onChange={e => setFormData(prev => ({ ...prev, battery_capacity_mah: parseInt(e.target.value) || undefined }))}
                            placeholder="e.g., 5000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cpu_manufacturer" className="text-xs">CPU Manufacturer</Label>
                          <Input
                            id="cpu_manufacturer"
                            value={formData.cpu_manufacturer || ""}
                            onChange={e => setFormData(prev => ({ ...prev, cpu_manufacturer: e.target.value }))}
                            placeholder="e.g., Intel, AMD"
                          />
                        </div>
                        <div>
                          <Label htmlFor="processor_type" className="text-xs">Processor Type</Label>
                          <Input
                            id="processor_type"
                            value={formData.processor_type || ""}
                            onChange={e => setFormData(prev => ({ ...prev, processor_type: e.target.value }))}
                            placeholder="e.g., Core i7"
                          />
                        </div>
                        <div>
                          <Label htmlFor="graphics_memory_gb" className="text-xs">Graphics Memory (GB)</Label>
                          <Input
                            id="graphics_memory_gb"
                            type="number"
                            value={formData.graphics_memory_gb || ""}
                            onChange={e => setFormData(prev => ({ ...prev, graphics_memory_gb: parseInt(e.target.value) || undefined }))}
                            placeholder="e.g., 8"
                          />
                        </div>
                        <div>
                          <Label htmlFor="memory_technology" className="text-xs">Memory Technology</Label>
                          <Select 
                            value={formData.memory_technology || ""} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, memory_technology: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DDR3">DDR3</SelectItem>
                              <SelectItem value="DDR4">DDR4</SelectItem>
                              <SelectItem value="DDR5">DDR5</SelectItem>
                              <SelectItem value="LPDDR4">LPDDR4</SelectItem>
                              <SelectItem value="LPDDR5">LPDDR5</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="panel_type" className="text-xs">Panel Type</Label>
                          <Select 
                            value={formData.panel_type || ""} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, panel_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select panel type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IPS">IPS</SelectItem>
                              <SelectItem value="VA">VA</SelectItem>
                              <SelectItem value="TN">TN</SelectItem>
                              <SelectItem value="OLED">OLED</SelectItem>
                              <SelectItem value="AMOLED">AMOLED</SelectItem>
                              <SelectItem value="LCD">LCD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="plug_type" className="text-xs">Plug Type</Label>
                          <Select 
                            value={formData.plug_type || ""} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, plug_type: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Type-C">Type-C</SelectItem>
                              <SelectItem value="USB-A">USB-A</SelectItem>
                              <SelectItem value="Lightning">Lightning</SelectItem>
                              <SelectItem value="Micro-USB">Micro-USB</SelectItem>
                              <SelectItem value="Mini-USB">Mini-USB</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="voltage" className="text-xs">Voltage</Label>
                          <Input
                            id="voltage"
                            value={formData.voltage || ""}
                            onChange={e => setFormData(prev => ({ ...prev, voltage: e.target.value }))}
                            placeholder="e.g., 110V, 220V"
                          />
                        </div>
                        <div>
                          <Label htmlFor="modem_type" className="text-xs">Modem Type</Label>
                          <Input
                            id="modem_type"
                            value={formData.modem_type || ""}
                            onChange={e => setFormData(prev => ({ ...prev, modem_type: e.target.value }))}
                            placeholder="e.g., 4G LTE, 5G"
                          />
                        </div>
                        <div>
                          <Label htmlFor="mount_type" className="text-xs">Mount Type</Label>
                          <Input
                            id="mount_type"
                            value={formData.mount_type || ""}
                            onChange={e => setFormData(prev => ({ ...prev, mount_type: e.target.value }))}
                            placeholder="e.g., VESA, Wall"
                          />
                        </div>
                        <div>
                          <Label htmlFor="connection_gender" className="text-xs">Connection Gender</Label>
                          <Select 
                            value={formData.connection_gender || ""} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, connection_gender: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Unisex">Unisex</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Attributes for Fashion */}
                {mainCategory === 'Fashion' && (
                  <ProductAttributes
                    category={mainCategory}
                    subcategory={subCategory}
                    attributes={productAttributes as any}
                    onAttributesChange={setProductAttributes}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sku">SKU (Auto-generated)</Label>
                    <Input
                      id="sku"
                      value={formData.sku || "Will be auto-generated"}
                      disabled
                      placeholder="Auto-generated on save"
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">SKU is automatically generated when you save the product</p>
                  </div>
                  <div>
                    <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min={0}
                      value={formData.stock_quantity}
                      onChange={e => setFormData(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>

                {/* Product Dimensions and Weight */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Product Dimensions & Weight</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label htmlFor="length_cm" className="text-xs">Length (cm)</Label>
                      <Input
                        id="length_cm"
                        type="number"
                        step="0.01"
                        min={0}
                        value={formData.length_cm || ""}
                        onChange={e => setFormData(prev => ({ ...prev, length_cm: parseFloat(e.target.value) || undefined }))}
                        placeholder="L"
                      />
                    </div>
                    <div>
                      <Label htmlFor="width_cm" className="text-xs">Width (cm)</Label>
                      <Input
                        id="width_cm"
                        type="number"
                        step="0.01"
                        min={0}
                        value={formData.width_cm || ""}
                        onChange={e => setFormData(prev => ({ ...prev, width_cm: parseFloat(e.target.value) || undefined }))}
                        placeholder="W"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height_cm" className="text-xs">Height (cm)</Label>
                      <Input
                        id="height_cm"
                        type="number"
                        step="0.01"
                        min={0}
                        value={formData.height_cm || ""}
                        onChange={e => setFormData(prev => ({ ...prev, height_cm: parseFloat(e.target.value) || undefined }))}
                        placeholder="H"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight_kg" className="text-xs">Weight (kg)</Label>
                      <Input
                        id="weight_kg"
                        type="number"
                        step="0.01"
                        min={0}
                        value={formData.weight_kg || ""}
                        onChange={e => setFormData(prev => ({ ...prev, weight_kg: parseFloat(e.target.value) || undefined }))}
                        placeholder="Weight"
                      />
                    </div>
                  </div>
                </div>

                {/* Warranty */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="has_warranty"
                      checked={formData.has_warranty || false}
                      onChange={e => setFormData(prev => ({ ...prev, has_warranty: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="has_warranty" className="text-base font-semibold cursor-pointer">
                      This product has warranty
                    </Label>
                  </div>

                  {formData.has_warranty && (
                    <div className="grid grid-cols-2 gap-3 ml-6">
                      <div>
                        <Label htmlFor="warranty_period" className="text-xs">Duration</Label>
                        <Input
                          id="warranty_period"
                          type="number"
                          min={1}
                          value={formData.warranty_period || ""}
                          onChange={e => setFormData(prev => ({ ...prev, warranty_period: parseInt(e.target.value) || undefined }))}
                          placeholder="Enter number"
                        />
                      </div>
                      <div>
                        <Label htmlFor="warranty_unit" className="text-xs">Unit</Label>
                        <Select 
                          value={formData.warranty_unit || ""} 
                          onValueChange={(value: 'months' | 'years') => setFormData(prev => ({ ...prev, warranty_unit: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="months">Months</SelectItem>
                            <SelectItem value="years">Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Methods */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Preferred Delivery Methods</Label>
                  <p className="text-xs text-muted-foreground">Select all applicable delivery methods</p>
                  <div className="space-y-3">
                    {[
                      { value: 'bicycle', label: 'Bicycle Delivery', desc: 'Best for: Very light packages (documents, accessories, small electronics)' },
                      { value: 'motorcycle', label: 'Motorcycle (Boda Boda)', desc: 'Best for: Small to medium parcels, food, fashion, electronics' },
                      { value: 'car', label: 'Private Car / Taxi', desc: 'Best for: Fragile or medium-sized items (flowers, electronics, groceries)' },
                      { value: 'pickup', label: 'Pickup Truck', desc: 'Best for: Bulkier or heavier goods like furniture, electronics' },
                      { value: 'truck', label: 'Light Commercial Truck', desc: 'Best for: Heavy goods — building materials, fridges, beds' },
                      { value: 'lorry', label: 'Lorry / Trailer', desc: 'Best for: Very heavy or bulk shipments — industrial items, pallets' },
                      { value: 'matatu', label: 'Matatu / Bus Parcel Service', desc: 'Best for: Inter-county or rural deliveries' }
                    ].map(method => (
                      <div key={method.value} className="flex items-start space-x-2 border rounded p-3">
                        <input
                          type="checkbox"
                          id={`delivery_${method.value}`}
                          checked={formData.delivery_methods?.includes(method.value) || false}
                          onChange={e => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              delivery_methods: checked
                                ? [...(prev.delivery_methods || []), method.value]
                                : (prev.delivery_methods || []).filter(m => m !== method.value)
                            }));
                          }}
                          className="w-4 h-4 mt-1"
                        />
                        <div>
                          <Label htmlFor={`delivery_${method.value}`} className="font-medium cursor-pointer">
                            {method.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">{method.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Materials (for Household items) */}
                {(mainCategory === 'Home & Lifestyle' || mainCategory === 'Furniture') && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Materials</Label>
                    <p className="text-xs text-muted-foreground">Select all materials used in this product</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {['Wood', 'Metal', 'Steel', 'Plastic', 'Glass', 'Fabric', 'Leather', 'Ceramic', 'Stone', 'Other'].map(material => (
                        <div key={material} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`material-${material}`}
                            checked={formData.materials?.includes(material) || false}
                            onChange={(e) => {
                              const materials = formData.materials || [];
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, materials: [...materials, material] }));
                              } else {
                                setFormData(prev => ({ ...prev, materials: materials.filter(m => m !== material) }));
                              }
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={`material-${material}`} className="text-sm cursor-pointer">{material}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label>Pickup Location *</Label>
                    <LocationSelect 
                      onLocationChange={handlePickupLocationChange} 
                      required 
                      initialLocation={{
                        county: formData.pickup_county || "",
                        constituency: formData.pickup_constituency || "",
                        ward: formData.pickup_ward || ""
                      }}
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Confirm your pickup location for delivery cost calculation
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="pickup_phone_number">Pickup Phone Number *</Label>
                    <Input
                      id="pickup_phone_number"
                      type="tel"
                      value={formData.pickup_phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, pickup_phone_number: e.target.value }))}
                      placeholder="e.g. +254700000000"
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Now (Current Price) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">Ksh</span>
                      <Input
                        id="price"
                        type="number"
                        min={0}
                        value={formData.price}
                        onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        required
                        placeholder="e.g. 19500"
                        className="pl-14 mb-1"
                      />
                                             {formData.price > 0 && commissionInfo && (
                         <div className="text-xs text-gray-600 mt-1">
                           You will receive <span className="font-semibold">Ksh {commissionInfo.vendor_earnings.toFixed(2)}</span>, <span className="font-semibold">Ksh {commissionInfo.isa_commission.toFixed(2)}</span> goes to ISA commission
                         </div>
                       )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="original_price">Was (Original Price)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">Ksh</span>
                      <Input
                        id="original_price"
                        type="number"
                        min={0}
                        value={formData.original_price ?? ''}
                        onChange={e => setFormData(prev => ({ ...prev, original_price: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        placeholder="e.g. 20000"
                        className="pl-14 mb-4"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="commission_percentage">Commission Percentage (%)</Label>
                  <Input
                    id="commission_percentage"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={formData.commission_percentage ?? ''}
                    onChange={e => setFormData(prev => ({ ...prev, commission_percentage: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    placeholder="e.g. 10 for 10%"
                    className="mb-4"
                  />
                </div>
                
                                 {/* Commission Information Display */}
                 {commissionInfo && mainCategory && (
                   <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                     <div className="flex items-center justify-between mb-3">
                       <h4 className="font-semibold text-gray-800 flex items-center">
                         <TrendingUp className="w-4 h-4 mr-2" />
                         Earnings Breakdown
                       </h4>
                       <Badge variant={commissionInfo.plan === 'premium' ? 'default' : 'secondary'} className="flex items-center">
                         <Crown className="w-3 h-3 mr-1" />
                         {commissionInfo.plan === 'premium' ? 'Premium' : 'Freemium'}
                       </Badge>
                     </div>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div>
                         <span className="text-gray-600">Product Price:</span>
                         <span className="font-semibold ml-1 text-gray-800">Ksh {formData.price.toLocaleString()}</span>
                       </div>
                       <div>
                         <span className="text-gray-600">ISA Commission ({commissionInfo.rate}%):</span>
                         <span className="font-semibold ml-1 text-red-600">Ksh {commissionInfo.isa_commission.toFixed(2)}</span>
                       </div>
                       <div className="col-span-2">
                         <span className="text-gray-600">Your Earnings:</span>
                         <span className="font-semibold ml-1 text-green-600 text-lg">Ksh {commissionInfo.vendor_earnings.toFixed(2)}</span>
                       </div>
                     </div>
                     <div className="mt-2 text-xs text-gray-500">
                       Category: {commissionInfo.category_path}
                     </div>
                     
                     {/* Upgrade Call-to-Action for Freemium Users */}
                     {commissionInfo.plan === 'freemium' && (
                       <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                         <div className="flex items-center justify-between">
                           <div className="flex-1">
                             <h5 className="font-semibold text-blue-800 flex items-center mb-1">
                               <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                               Upgrade to Premium
                             </h5>
                             <p className="text-xs text-blue-700 mb-2">
                               Reduce commission from {commissionInfo.rate}% down to around 5% and earn more!
                             </p>
                             <div className="text-xs text-blue-600">
                               <span className="font-semibold">Premium earnings:</span> Ksh {(formData.price * 0.95).toFixed(2)} 
                               <span className="text-green-600 ml-2">(+Ksh {(formData.price * 0.05).toFixed(2)} more)</span>
                             </div>
                           </div>
                                                       <Button 
                              size="sm" 
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs px-3 py-1"
                              onClick={() => {
                                // Navigate to subscription section in dashboard
                                navigate('/vendor-dashboard?section=subscription');
                                toast({
                                  title: "Premium Upgrade",
                                  description: "Redirecting to subscription plans...",
                                  variant: "default"
                                });
                              }}
                            >
                              Upgrade Now
                            </Button>
                         </div>
                       </div>
                     )}
                   </div>
                 )}
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <div>
                  <Label>Product Images (Minimum 3 required)</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload at least 3 product images. The first image will be used as the main product image.
                  </p>
                  <ImageUpload
                    onImageUpload={handleImageUpload}
                    onImageRemove={handleImageRemove}
                    existingImages={formData.images || []}
                    multiple={true}
                    maxImages={5}
                  />
                  {formData.images && formData.images.length < 3 && (
                    <p className="text-sm text-red-600 mt-2">
                      Please upload at least {3 - formData.images.length} more image(s)
                    </p>
                  )}
                </div>
                
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="featured">Featured Product</Label>
                    <p className="text-sm text-gray-600">Show this product in featured sections</p>
                  </div>
                  <Switch
                    id="featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="active">Active Product</Label>
                    <p className="text-sm text-gray-600">Make this product visible to customers</p>
                  </div>
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>

                {/* Return Policy Section */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-900">Return Policy</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="return_eligible">Eligible for Return</Label>
                      <p className="text-sm text-gray-600">Can customers return this item after purchase?</p>
                    </div>
                    <Switch
                      id="return_eligible"
                      checked={formData.return_eligible || false}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, return_eligible: checked }))}
                    />
                  </div>

                  {formData.return_eligible ? (
                    <div>
                      <Label htmlFor="return_policy_guidelines">Return Guidelines</Label>
                      <p className="text-sm text-gray-600 mb-2">Specify the conditions under which the product can be returned</p>
                      <Textarea
                        id="return_policy_guidelines"
                        value={formData.return_policy_guidelines || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, return_policy_guidelines: e.target.value }))}
                        placeholder="e.g., Product must be undamaged, in original packaging, with all accessories included. No signs of wear or use."
                        rows={3}
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="return_policy_reason">Reason for No Returns</Label>
                      <p className="text-sm text-gray-600 mb-2">Explain why this product cannot be returned</p>
                      <Textarea
                        id="return_policy_reason"
                        value={formData.return_policy_reason || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, return_policy_reason: e.target.value }))}
                        placeholder="e.g., Highly consumable item like perfumes that cannot be resold for hygiene reasons"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setShowAddDialog(false);
                setEditingProduct(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      )}
      <Dialog open={banReasonDialogOpen} onOpenChange={setBanReasonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban Reason</DialogTitle>
            <DialogDescription className="sr-only">
              View the reason why this product was banned.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 text-red-700 whitespace-pre-line">
            {banReasonText}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setBanReasonDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorProductManagement;