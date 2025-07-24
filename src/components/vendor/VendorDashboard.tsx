
import { useState } from "react";
import VendorSidebar from "./VendorSidebar";
import VendorHome from "./sections/VendorHome";
import VendorProductManagement from "./VendorProductManagement";
import VendorOrders from "./sections/VendorOrders";
import VendorReviews from "./sections/VendorReviews";
import VendorPayments from "./sections/VendorPayments";
import VendorWallet from "./sections/VendorWallet";
import VendorSettings from "./sections/VendorSettings";

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
        return <VendorOrders vendorId={user.id} />;
      case "store":
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">My Store</h1>
            <VendorProductManagement user={user} />
          </div>
        );
      case "payments":
        return <VendorPayments vendorId={user.id} />;
      case "reviews":
        return <VendorReviews vendorId={user.id} />;
      case "wallet":
        return <VendorWallet vendorId={user.id} />;
      case "settings":
        return <VendorSettings vendorId={user.id} />;
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
