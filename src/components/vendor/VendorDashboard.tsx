
import { useEffect, useState } from "react";
import { AlertTriangle, Menu, X, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import VendorSidebar from "./VendorSidebar";
import VendorHome from "./sections/VendorHome";
import VendorProductManagement from "./VendorProductManagement";
import VendorOrders from "./sections/VendorOrders";
import VendorReviews from "./sections/VendorReviews";
import VendorPayments from "./sections/VendorPayments";
import VendorWallet from "./sections/VendorWallet";
import VendorSubscription from "./VendorSubscription";
import VendorSettings from "./sections/VendorSettings";
import { Button } from "@/components/ui/button";
import { ProductService } from "@/services/productService";

interface VendorDashboardProps {
  user: any;
  onLogout: () => void;
}

const VendorDashboard = ({ user, onLogout }: VendorDashboardProps) => {
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState("home");
  const [plan, setPlan] = useState('free');
  const [planExpiry, setPlanExpiry] = useState<string | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFromBanner, setUpgradeFromBanner] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const PLAN_LIMITS: Record<string, number> = {
    free: Infinity,
    premium_weekly: Infinity,
    premium_monthly: Infinity,
    premium_yearly: Infinity,
    pro: Infinity
  };

  useEffect(() => {
    fetchPlanAndProducts();
    fetchNotifications();
    
    // Check for section parameter in URL
    const sectionParam = searchParams.get('section');
    if (sectionParam) {
      setActiveSection(sectionParam);
    }
  }, [user.id, searchParams]);

  const fetchPlanAndProducts = async () => {
    // Fetch plan from profiles.preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();
    let preferences = profile?.preferences;
    if (typeof preferences === 'string') {
      try { preferences = JSON.parse(preferences); } catch { preferences = {}; }
    }
    // Safely extract plan and plan_expiry from preferences if it's an object
    const planValue = (preferences && typeof preferences === 'object' && 'plan' in preferences && typeof preferences.plan === 'string')
      ? preferences.plan
      : 'free';
    const planExpiryValue = (preferences && typeof preferences === 'object' && 'plan_expiry' in preferences && typeof preferences.plan_expiry === 'string')
      ? preferences.plan_expiry
      : null;
    setPlan(planValue);
    setPlanExpiry(planExpiryValue);
    // Fetch product count
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .eq('vendor_id', user.id);
    setProductCount(products?.length || 0);
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    const result = await ProductService.fetchNotificationsByVendor(user.id);
    if (!result.error && result.data) {
      setNotifications(result.data);
      setUnreadCount(result.data.filter((n: any) => !n.read).length);
    }
    setNotificationsLoading(false);
  };

  const handleOpenNotifications = async () => {
    setNotificationsOpen((open) => !open);
    if (!notificationsOpen) {
      // Mark all unread as read
      const unread = notifications.filter((n: any) => !n.read);
      await Promise.all(unread.map((n: any) => ProductService.markNotificationAsRead(n.id)));
      fetchNotifications();
    }
  };

  const handleUpgradeClick = () => {
    setActiveSection('settings');
    setUpgradeFromBanner(true);
    setMobileMenuOpen(false);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    const UpgradeButton = () => (
      <div className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange-600 font-semibold">🚀 Premium Features Coming Soon!</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Early Access</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Marketing promotions & customer notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Reduced commission rates for higher profits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Priority support & advanced analytics</span>
              </div>
            </div>
          </div>
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded shadow text-sm whitespace-nowrap cursor-not-allowed opacity-60 ml-4"
            disabled={true}
          >
            Upgrade Coming Soon
          </button>
        </div>
      </div>
    );

    switch (activeSection) {
      case "home":
        return (
          <div>
            <UpgradeButton />
            <VendorHome vendorId={user.id} plan={plan} planExpiry={planExpiry} productCount={productCount} onUpgrade={handleUpgradeClick} />
          </div>
        );
      case "products":
        return (
          <div>
            <UpgradeButton />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">My Products</h1>
            <VendorProductManagement user={user} />
          </div>
        );
      case "orders":
        return (
          <div>
            <UpgradeButton />
            <VendorOrders vendorId={user.id} />
          </div>
        );
      case "store":
        return (
          <div>
            <UpgradeButton />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">My Store</h1>
            <VendorProductManagement user={user} />
          </div>
        );
      case "payments":
        return (
          <div>
            <UpgradeButton />
            <VendorPayments vendorId={user.id} />
          </div>
        );
      case "reviews":
        return (
          <div>
            <UpgradeButton />
            <VendorReviews vendorId={user.id} />
          </div>
        );
      case "wallet":
        return (
          <div>
            <UpgradeButton />
            <VendorWallet vendorId={user.id} />
          </div>
        );
      case "subscription":
        return (
          <div>
            <UpgradeButton />
            <VendorSubscription />
          </div>
        );
      case "settings-account":
        return (
          <div>
            <UpgradeButton />
            <VendorSettings vendorId={user.id} defaultTab="account" showUpgradeModal={upgradeFromBanner} onCloseUpgradeModal={() => setUpgradeFromBanner(false)} />
          </div>
        );
      case "settings-payout":
        return (
          <div>
            <UpgradeButton />
            <VendorSettings vendorId={user.id} defaultTab="payout" showUpgradeModal={upgradeFromBanner} onCloseUpgradeModal={() => setUpgradeFromBanner(false)} />
          </div>
        );
      case "settings-billing":
        return (
          <div>
            <UpgradeButton />
            <VendorSettings vendorId={user.id} defaultTab="billing" showUpgradeModal={upgradeFromBanner} onCloseUpgradeModal={() => setUpgradeFromBanner(false)} />
          </div>
        );
      default:
        return (
          <div>
            <UpgradeButton />
            <VendorHome vendorId={user.id} plan={plan} planExpiry={planExpiry} productCount={productCount} onUpgrade={handleUpgradeClick} />
          </div>
        );
    }
  };

  // Orange banner
  const productLimit = PLAN_LIMITS[plan] === Infinity ? 'Unlimited' : PLAN_LIMITS[plan];
  const showBanner = false; // Hide banner since all plans now have unlimited products

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <VendorSidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          onLogout={onLogout}
          userName={user.name}
        />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <VendorSidebar
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              onLogout={onLogout}
              userName={user.name}
              isMobile={true}
            />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Vendor Portal</h1>
              <p className="text-sm text-gray-600">{user.name}</p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8">
          {showBanner && (
            <div className="mb-6 bg-orange-100 border-l-4 border-orange-500 p-4 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-orange-500 w-6 h-6 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-orange-800 text-sm sm:text-base">
                    {plan === 'free' && `You are on the Free Plan: `}
                    {plan.startsWith('premium') && `You are on the Premium Plan: `}
                    {productCount}/{productLimit} products uploaded
                    {planExpiry && plan !== 'free' && (
                      <span className="block sm:inline sm:ml-2 text-xs text-orange-700">(Expires: {new Date(planExpiry).toLocaleDateString()})</span>
                    )}
                  </span>
                </div>
              </div>
              <button
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded shadow text-sm whitespace-nowrap"
                onClick={handleUpgradeClick}
              >
                Upgrade Coming Soon
              </button>
            </div>
          )}
          {/* Add notification bell to the top right of the dashboard (desktop and mobile) */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Vendor Portal</h1>
              <p className="text-sm text-gray-600">{user.name}</p>
            </div>
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={handleOpenNotifications}>
                <Bell className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-4 border-b font-semibold text-gray-900 flex items-center justify-between">
                    Notifications
                    <Button variant="ghost" size="sm" onClick={() => setNotificationsOpen(false)}>Close</Button>
                  </div>
                  {notificationsLoading ? (
                    <div className="p-4 text-gray-500">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-gray-500">No notifications</div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div key={n.id} className={`p-4 border-b last:border-b-0 ${!n.read ? 'bg-blue-50' : ''}`}>
                        <div className="font-medium text-gray-800 mb-1">
                          {n.type === 'product_approved' ? 'Product Approved' : 'Action Needed'}
                        </div>
                        <div className="text-gray-700 text-sm mb-1">{n.message}</div>
                        <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          {renderContent()}
          {/* Upgrade Modal Placeholder */}
          {showUpgrade && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Upgrade Your Plan</h3>
                <p className="mb-4">To upload more products and enjoy lower commissions, upgrade your plan in the Settings &gt; Billing section.</p>
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded shadow w-full"
                  onClick={() => setShowUpgrade(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VendorDashboard;
