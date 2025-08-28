import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHome from "./sections/AdminHome";
import AdminUsers from "./sections/AdminUsers";
import AdminVendors from "./sections/AdminVendors";
import AdminOrders from "./sections/AdminOrders";
import AdminProducts from "./sections/AdminProducts";
import AdminPayments from "./sections/AdminPayments";
import AdminLoyalty from "./sections/AdminLoyalty";
import AdminSubscriptions from "./sections/AdminSubscriptions";
import AdminStyleQuiz from "./sections/AdminStyleQuiz";
import AdminDelivery from "./sections/AdminDelivery";
import AdminRoles from "./sections/AdminRoles";
import AdminTraining from "./sections/AdminTraining";
import AdminNotifications from "./sections/AdminNotifications";
import AdminCustomerSupport from "./sections/AdminCustomerSupport";
import AdminTrendingPosts from "./sections/AdminTrendingPosts";

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
      case "loyalty":
        return <AdminLoyalty />;
      case "subscriptions":
        return <AdminSubscriptions />;
      case "style-quiz":
        return <AdminStyleQuiz />;
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