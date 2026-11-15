
import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";

import {
  Users,
  User,
  Headset,
  Ticket,
  FolderOpen,
  UserCheck,
  Clock,
  CheckCircle,
  Lock,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";

import api from "../../services/api";
import "./AdminDashboard.css";
import AdminSidebar from "./AdminSidebar";

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // Logout Admin
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  // Fetch Dashboard Statistics
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/dashboard");
      setDashboard(response.data);

    } catch (err) {
      console.error("Admin dashboard error:", err);

      setError(
        err.response?.data?.detail ||
        "Unable to load admin dashboard."
      );

    } finally {
      setLoading(false);
    }
  };

  // Load Dashboard
  useEffect(() => {
    fetchDashboard();
  }, []);

  // Dashboard Statistics
  const stats = [
    { title: "Total Users", value: dashboard?.total_users, icon: Users },
    { title: "Customers", value: dashboard?.total_customers, icon: User },
    { title: "Agents", value: dashboard?.total_agents, icon: Headset },
    { title: "Total Tickets", value: dashboard?.total_tickets, icon: Ticket },
    { title: "Open Tickets", value: dashboard?.open_tickets, icon: FolderOpen },
    { title: "Assigned Tickets", value: dashboard?.assigned_tickets, icon: UserCheck },
    { title: "In Progress", value: dashboard?.in_progress_tickets, icon: Clock },
    { title: "Resolved", value: dashboard?.resolved_tickets, icon: CheckCircle },
    { title: "Closed", value: dashboard?.closed_tickets, icon: Lock },
    { title: "High Priority", value: dashboard?.high_priority_tickets, icon: AlertTriangle }
  ];

  if (loading) {
    return (
      <div className="admin-loading">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="admin-dashboard">

      {/* Left Sidebar */}
      <AdminSidebar />


      {/* Main Dashboard Content */}
      <main className="admin-main">

        {/* Dashboard Header */}
        <div className="admin-header">

          <div>
            <h1>Admin Dashboard</h1>
            <p>
              Monitor users, tickets, and support performance.
            </p>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchDashboard}
            className="admin-refresh"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </div>

        {/* Error Message */}
        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {/* Dashboard Statistics */}
        {dashboard && (
          <div className="admin-stats-grid">

            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="admin-stat-card"
                  key={item.title}
                >
                  <div className="admin-stat-icon">
                    <Icon size={23} />
                  </div>

                  <div>
                    <p>{item.title}</p>
                    <h2>{item.value ?? 0}</h2>
                  </div>

                </div>
              );
            })}

          </div>
        )}

      </main>

    </div>
  );
}

export default AdminDashboard;
