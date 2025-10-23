import { useState } from "react";
import { 
  Home, 
  Users, 
  Package, 
  CreditCard, 
  Star, 
  Truck, 
  Settings, 
  Bell, 
  Wallet, 
  UserCheck, 
  MessageSquare, 
  TrendingUp, 
  RotateCcw,
  Store,
  ShoppingCart,
  Shield,
  Volume2,
  Ticket,
  LogOut,
  ChevronRight,
  MessageCircle,
  UserCog,
  FileText,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  userName: string;
  userRole?: string;
  canAccessSection?: (section: string) => boolean;
}

export function AdminSidebar({ activeSection, onSectionChange, onLogout, userName, userRole, canAccessSection }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Overview', icon: Home },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'sku_search', label: 'SKU Search', icon: Search },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'loyalty', label: 'Loyalty Program', icon: Wallet },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'style-quiz', label: 'Style Quiz', icon: Star },
    { id: 'returns', label: 'Item Returns', icon: RotateCcw },
    { id: 'delivery', label: 'Manage Delivery', icon: Truck },
    { id: 'roles', label: 'Admin Roles', icon: Shield },
    { id: 'training', label: 'Training Modules', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'manage-sounds', label: 'Manage Sounds', icon: Volume2 },
    { id: 'tickets', label: 'Support Tickets', icon: Ticket },
    { id: 'customer-support', label: 'Customer Support', icon: MessageCircle },
    { id: 'trending-posts', label: 'Trending Posts', icon: TrendingUp },
    { id: 'admin_management', label: 'Admin Management', icon: UserCog },
    { id: 'vendor_guidelines', label: 'Vendor Guidelines', icon: FileText },
    { id: 'moderation', label: 'Chat Moderation', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Filter menu items based on role permissions
  const filteredMenuItems = menuItems.filter(item => 
    !canAccessSection || canAccessSection(item.id)
  );

  return (
    <div className={cn(
      "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Earth Portal
              </h2>
              <p className="text-sm text-gray-600 truncate">{userName}</p>
              {userRole && (
                <p className="text-xs text-gray-500 capitalize">
                  {userRole.replace('_', ' ')}
                </p>
              )}
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-auto"
          >
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed ? "rotate-0" : "rotate-180"
            )} />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start h-10 px-3",
                isActive && "bg-blue-600 text-white hover:bg-blue-700",
                !isActive && "text-gray-700 hover:bg-gray-100",
                isCollapsed && "px-2 justify-center"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 px-3 text-red-600 hover:bg-red-50 hover:text-red-700",
            isCollapsed && "px-2 justify-center"
          )}
          onClick={onLogout}
        >
          <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}

export default AdminSidebar;
