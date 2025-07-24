
import { useState } from "react";
import VendorSidebar from "./VendorSidebar";
import VendorHome from "./sections/VendorHome";
import VendorProductManagement from "./VendorProductManagement";

interface VendorDashboardProps {
  user: any;
  onLogout: () => void;
}

const VendorDashboard = ({ user, onLogout }: VendorDashboardProps) => {
  const [activeSection, setActiveSection] = useState("home");

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <VendorHome vendorId={user.id} />;
      case "products":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Products</h1>
            <VendorProductManagement user={user} />
          </div>
        );
      case "orders":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Orders</h1>
            <p className="text-gray-600">Orders management coming soon...</p>
          </div>
        );
      case "store":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Store</h1>
            <VendorProductManagement user={user} />
          </div>
        );
      case "payments":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Customer Payments</h1>
            <p className="text-gray-600">Payment tracking coming soon...</p>
          </div>
        );
      case "reviews":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Customer Reviews</h1>
            <p className="text-gray-600">Reviews management coming soon...</p>
          </div>
        );
      case "wallet":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Wallet</h1>
            <p className="text-gray-600">Wallet management coming soon...</p>
          </div>
        );
      case "settings":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
            <p className="text-gray-600">Settings management coming soon...</p>
          </div>
        );
      default:
        return <VendorHome vendorId={user.id} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <VendorSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={onLogout}
        userName={user.name}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default VendorDashboard;
