import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHome from "./sections/AdminHome";
import AdminUsers from "./sections/AdminUsers";
import AdminVendors from "./sections/AdminVendors";
import AdminOrders from "./sections/AdminOrders";
import AdminProducts from "./sections/AdminProducts";
import AdminPayments from "./sections/AdminPayments";
import AdminWallet from "./sections/AdminWallet";
import AdminDelivery from "./sections/AdminDelivery";

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

const AdminDashboard = ({ user, onLogout }: AdminDashboardProps) => {
  const [activeSection, setActiveSection] = useState("home");

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
      case "payments":
        return <AdminPayments />;
      case "wallet":
        return <AdminWallet />;
      case "delivery":
        return <AdminDelivery />;
      default:
        return <AdminHome />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
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

export default AdminDashboard;