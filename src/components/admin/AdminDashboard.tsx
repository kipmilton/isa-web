import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import AdminHome from "./sections/AdminHome";
import AdminUsers from "./sections/AdminUsers";
import AdminVendors from "./sections/AdminVendors";
import AdminOrders from "./sections/AdminOrders";
import AdminProducts from "./sections/AdminProducts";
import AdminPayments from "./sections/AdminPayments";
import AdminLoyalty from "./sections/AdminLoyalty";
import AdminSubscriptions from "./sections/AdminSubscriptions";
import AdminStyleQuiz from "./sections/AdminStyleQuiz";
import AdminReturns from "./sections/AdminReturns";
import AdminDelivery from "./sections/AdminDelivery";
import AdminRoles from "./sections/AdminRoles";
import AdminTraining from "./sections/AdminTraining";
import AdminNotifications from "./sections/AdminNotifications";
import AdminCustomerSupport from "./sections/AdminCustomerSupport";
import AdminTrendingPosts from "./sections/AdminTrendingPosts";
import AdminSounds from "./sections/AdminSounds";
import AdminTickets from "./sections/AdminTickets";
import AdminWallet from "./sections/AdminWallet";
import AdminManagement from "./sections/AdminManagement";
import VendorGuidelines from "./sections/VendorGuidelines";
import AdminSKUSearch from "./sections/AdminSKUSearch";
import PasswordResetDialog from "./PasswordResetDialog";

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
  mustResetPassword?: boolean;
  adminRole?: any;
}

const AdminDashboard = ({ user, onLogout, mustResetPassword, adminRole }: AdminDashboardProps) => {
  const [activeSection, setActiveSection] = useState("home");
  const [showPasswordReset, setShowPasswordReset] = useState(mustResetPassword || false);

  // Filter sections based on admin role
  const canAccessSection = (section: string) => {
    if (adminRole?.role === 'main_admin') return true;
    
    const rolePermissions: Record<string, string[]> = {
      'vendor_admin': ['home', 'vendors', 'products', 'tickets', 'vendor_guidelines', 'sku_search'],
      'customer_service_admin': ['home', 'vendors', 'tickets', 'customer_support', 'returns'],
      'order_admin': ['home', 'orders', 'products', 'returns', 'sku_search']
    };
    
    return rolePermissions[adminRole?.role]?.includes(section) || false;
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <AdminHome />;
      case "users":
        return <AdminUsers />;
      case "vendors":
        return <AdminVendors />;
      case "orders":
        return <AdminOrders />;
      case "products":
        return <AdminProducts />;
      case "sku_search":
        return <AdminSKUSearch />;
      case "payments":
        return <AdminPayments />;
      case "loyalty":
        return <AdminLoyalty />;
      case "subscriptions":
        return <AdminSubscriptions />;
      case "style-quiz":
        return <AdminStyleQuiz />;
      case "returns":
        return <AdminReturns />;
      case "delivery":
        return <AdminDelivery />;
      case "roles":
        return <AdminRoles />;
      case "training":
        return <AdminTraining />;
      case "notifications":
        return <AdminNotifications />;
      case "customer-support":
        return <AdminCustomerSupport />;
      case "trending-posts":
        return <AdminTrendingPosts />;
      case "manage-sounds":
        return <AdminSounds />;
      case "tickets":
        return <AdminTickets />;
      case "wallet":
        return <AdminWallet />;
      case "admin_management":
        return <AdminManagement currentUserId={user.id} />;
      case "vendor_guidelines":
        return <VendorGuidelines />;
      case "settings":
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Settings</h2>
            <button
              onClick={() => setShowPasswordReset(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reset Password
            </button>
          </div>
        );
      default:
        return <AdminHome />;
    }
  };

  return (
    <>
      <PasswordResetDialog
        open={showPasswordReset}
        userId={user.id}
        mandatory={mustResetPassword}
        onSuccess={() => {
          setShowPasswordReset(false);
          window.location.reload();
        }}
      />
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={onLogout}
          userName={user?.name || 'Admin'}
          userRole={adminRole?.role}
          canAccessSection={canAccessSection}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
};

export default AdminDashboard;
