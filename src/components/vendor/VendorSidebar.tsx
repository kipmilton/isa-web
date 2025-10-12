import { useState } from "react";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Store, 
  CreditCard, 
  Star, 
  Wallet, 
  Settings,
  User,
  Receipt,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
  Crown,
  Building,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VendorSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  userName: string;
  isMobile?: boolean;
}

const VendorSidebar = ({ activeSection, onSectionChange, onLogout, userName, isMobile = false }: VendorSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'store', label: 'My Store', icon: Store },
    { id: 'support', label: 'Customer Support', icon: MessageCircle },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reviews', label: 'Customer Reviews', icon: Star },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'subscription', label: 'Subscription', icon: Crown },
  ];

  const settingsSubItems = [
    { id: 'settings-account', label: 'Account', icon: User },
    { id: 'settings-payout', label: 'Payout', icon: Building },
    { id: 'settings-billing', label: 'Billing', icon: CreditCard },
  ];

  const isSettingsActive = activeSection.startsWith('settings-');
  const isSettingsExpanded = settingsExpanded || isSettingsActive;

  return (
    <div className={cn(
      "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isMobile ? "w-64" : isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {(!isCollapsed || isMobile) && (
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">Vendor Portal</h2>
              <p className="text-sm text-gray-600 truncate">{userName}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSectionChange(activeSection)}
                className="text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            {!isMobile && (
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
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
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
                !isMobile && isCollapsed && "px-2 justify-center"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className={cn("h-4 w-4", (!isCollapsed || isMobile) && "mr-3")} />
              {(!isCollapsed || isMobile) && <span>{item.label}</span>}
            </Button>
          );
        })}

        {/* Settings Section */}
        <div className="space-y-1">
          <Button
            variant={isSettingsActive ? "default" : "ghost"}
            className={cn(
              "w-full justify-between h-10 px-3",
              isSettingsActive && "bg-blue-600 text-white hover:bg-blue-700",
              !isSettingsActive && "text-gray-700 hover:bg-gray-100",
              !isMobile && isCollapsed && "px-2 justify-center"
            )}
            onClick={() => {
              if (isCollapsed && !isMobile) {
                onSectionChange('settings-account');
              } else {
                setSettingsExpanded(!settingsExpanded);
                if (!isSettingsActive) {
                  onSectionChange('settings-account');
                }
              }
            }}
          >
            <div className="flex items-center">
              <Settings className={cn("h-4 w-4", (!isCollapsed || isMobile) && "mr-3")} />
              {(!isCollapsed || isMobile) && <span>Settings</span>}
            </div>
            {(!isCollapsed || isMobile) && (
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                isSettingsExpanded ? "rotate-180" : "rotate-0"
              )} />
            )}
          </Button>

          {/* Settings Sub-items */}
          {isSettingsExpanded && (!isCollapsed || isMobile) && (
            <div className="ml-4 space-y-1">
              {settingsSubItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start h-8 px-3 text-sm",
                      isActive && "bg-blue-600 text-white hover:bg-blue-700",
                      !isActive && "text-gray-600 hover:bg-gray-100"
                    )}
                    onClick={() => onSectionChange(item.id)}
                  >
                    <Icon className="h-3 w-3 mr-2" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 px-3 text-red-600 hover:bg-red-50 hover:text-red-700",
            !isMobile && isCollapsed && "px-2 justify-center"
          )}
          onClick={onLogout}
        >
          <LogOut className={cn("h-4 w-4", (!isCollapsed || isMobile) && "mr-3")} />
          {(!isCollapsed || isMobile) && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
};

export default VendorSidebar;