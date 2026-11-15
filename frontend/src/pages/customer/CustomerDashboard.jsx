import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  LogOut,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Headphones,
  ArrowRight,
  RefreshCw,
  Bell,
  CheckCheck,
} from "lucide-react";
import api from "../../services/api";

function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // ============================================================
  // GET CURRENT USER + TICKETS
  // ============================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Get current user
        const userResponse = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(userResponse.data);

        // Get customer's tickets
        const ticketsResponse = await api.get("/tickets/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log(
          "Customer tickets:",
          ticketsResponse.data
        );

        setTickets(ticketsResponse.data);

      } catch (error) {
        console.error(
          "Unable to load customer dashboard:",
          error
        );

        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("user");

          navigate("/login");
          return;
        }

        setError(
          error.response?.data?.detail ||
            "Unable to load dashboard data."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // ============================================================
  // REFRESH DASHBOARD
  // ============================================================

  const refreshDashboard = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setError("");

      const response = await api.get("/tickets/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTickets(response.data);

    } catch (error) {
      console.error(
        "Unable to refresh tickets:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Unable to refresh tickets."
      );
    }
  };

  // ============================================================
  // FETCH CUSTOMER NOTIFICATIONS
  // ============================================================

  const fetchNotifications = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setNotificationLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Get all notifications
      const notificationResponse = await api.get(
        "/notifications/",
        { headers }
      );

      setNotifications(notificationResponse.data);

      // Get unread notification count
      const countResponse = await api.get(
        "/notifications/unread-count",
        { headers }
      );

      const countData = countResponse.data;

      setUnreadCount(
        typeof countData === "number"
          ? countData
          : countData.unread_count ?? countData.count ?? 0
      );

    } catch (error) {
      console.error(
        "Unable to load notifications:",
        error
      );
    } finally {
      setNotificationLoading(false);
    }
  };

  // ============================================================
  // MARK ONE NOTIFICATION AS READ
  // ============================================================

  const markNotificationAsRead = async (notificationId) => {
    const token = localStorage.getItem("access_token");

    try {
      await api.patch(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchNotifications();

    } catch (error) {
      console.error(
        "Unable to mark notification as read:",
        error
      );
    }
  };

  // ============================================================
  // MARK ALL NOTIFICATIONS AS READ
  // ============================================================

  const markAllNotificationsAsRead = async () => {
    const token = localStorage.getItem("access_token");

    try {
      await api.patch(
        "/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchNotifications();

    } catch (error) {
      console.error(
        "Unable to mark all notifications as read:",
        error
      );
    }
  };

  // ============================================================
  // LOAD NOTIFICATIONS WHEN DASHBOARD OPENS
  // ============================================================

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    (ticket) =>
      ticket.status?.toLowerCase() === "open"
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) =>
      ticket.status?.toLowerCase() === "in_progress"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status?.toLowerCase() === "resolved" ||
      ticket.status?.toLowerCase() === "closed"
  ).length;

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <RefreshCw
          size={30}
          className="loading-spinner"
        />

        <p>Loading dashboard...</p>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="customer-dashboard">

      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside className="dashboard-sidebar">

        <div className="sidebar-logo">

          <div className="sidebar-logo-icon">
            <Headphones size={22} />
          </div>
          <div className="sidebar-logo-text">
            <strong>Customer Portal</strong>
            <small>Your Support Center</small>
          </div>
        </div>

        <nav className="sidebar-nav">

          {/* Dashboard */}

          <button
            className="sidebar-item active"
            onClick={() =>
              navigate("/customer/dashboard")
            }
          >
            <LayoutDashboard size={19} />

            <span>Dashboard</span>
          </button>

          {/* My Tickets */}

          <button
            className="sidebar-item"
            onClick={() =>
              navigate("/customer/tickets")
            }
          >
            <Ticket size={19} />

            <span>My Tickets</span>
          </button>

          {/* Create Ticket */}

          <button
            className="sidebar-item"
            onClick={() =>
              navigate("/customer/create-ticket")
            }
          >
            <PlusCircle size={19} />

            <span>Create Ticket</span>
          </button>

        </nav>

        {/* Logout */}

        <div className="sidebar-bottom">

          <button
            className="customer-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={19} />

            <span>Logout</span>
          </button>

        </div>

      </aside>

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}

      <main className="dashboard-main">

        {/* ====================================================
            TOP NAVBAR
            ==================================================== */}

        <header className="dashboard-navbar">

          <div>
            <h2>Customer Dashboard</h2>

            <p>
              Manage your support requests
            </p>
          </div>

          {/* ==================================================
              NOTIFICATION BELL + CUSTOMER PROFILE
              ================================================== */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              position: "relative",
            }}
          >

            {/* Notification Bell */}

            <div style={{ position: "relative" }}>

              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);

                  if (!showNotifications) {
                    fetchNotifications();
                  }
                }}
                style={{
                  position: "relative",
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: "50%",
                  width: "42px",
                  height: "42px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Notifications"
              >

                <Bell size={21} color="#374151" />

                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: "50%",
                      minWidth: "19px",
                      height: "19px",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 3px",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}

              </button>

              {/* Notification Dropdown */}

              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: "52px",
                    right: "0",
                    width: "350px",
                    maxHeight: "420px",
                    overflowY: "auto",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                    zIndex: 1000,
                  }}
                >

                  {/* Dropdown Header */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "15px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >

                    <strong>Notifications</strong>

                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#2563eb",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        <CheckCheck size={14} />
                        Mark all as read
                      </button>
                    )}

                  </div>

                  {/* Notification Loading */}

                  {notificationLoading ? (

                    <p style={{ padding: "15px" }}>
                      Loading notifications...
                    </p>

                  ) : notifications.length === 0 ? (

                    <p
                      style={{
                        padding: "20px",
                        textAlign: "center",
                      }}
                    >
                      No notifications yet.
                    </p>

                  ) : (

                    notifications.map((notification) => (

                      <div
                        key={notification.id}
                        style={{
                          padding: "14px",
                          borderBottom: "1px solid #f1f1f1",
                          background: notification.is_read
                            ? "#fff"
                            : "#eff6ff",
                        }}
                      >

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >

                          <strong style={{ fontSize: "13px" }}>
                            {notification.title}
                          </strong>

                          {!notification.is_read && (
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "#2563eb",
                                flexShrink: 0,
                              }}
                            />
                          )}

                        </div>

                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            margin: "7px 0",
                          }}
                        >
                          {notification.message}
                        </p>

                        {!notification.is_read && (
                          <button
                            onClick={() =>
                              markNotificationAsRead(notification.id)
                            }
                            style={{
                              background: "none",
                              border: "none",
                              color: "#2563eb",
                              cursor: "pointer",
                              fontSize: "12px",
                              padding: 0,
                            }}
                          >
                            Mark as read
                          </button>
                        )}

                      </div>

                    ))

                  )}

                </div>
              )}

            </div>

            {/* Existing Customer Profile */}

            <div className="user-profile">

              <div className="user-avatar">
                <User size={20} />
              </div>

              <div className="user-info">

                <strong>
                  {user?.name || "Customer"}
                </strong>

                <span>
                  {user?.email || ""}
                </span>

              </div>

            </div>

          </div>

        </header>

        {/* ====================================================
            WELCOME
            ==================================================== */}

        <section className="welcome-section">

          <div>

            <h1>
              Welcome back,{" "}
              {user?.name || "Customer"} 👋
            </h1>

            <p>
              How can we help you today?
            </p>

          </div>

          <button
            className="create-ticket-button"
            onClick={() =>
              navigate("/customer/create-ticket")
            }
          >
            <PlusCircle size={19} />

            Create Ticket
          </button>

        </section>

        {/* ====================================================
            ERROR
            ==================================================== */}

        {error && (
          <div className="agent-error">
            <AlertCircle size={19} />

            <span>{error}</span>
          </div>
        )}

        {/* ====================================================
            STATISTICS
            ==================================================== */}

        <section className="stats-grid">

          {/* Total */}

          <div className="stat-card">

            <div className="stat-icon">
              <Ticket size={22} />
            </div>

            <div>
              <span>Total Tickets</span>

              <strong>{totalTickets}</strong>
            </div>

          </div>

          {/* Open */}

          <div className="stat-card">

            <div className="stat-icon">
              <Clock size={22} />
            </div>

            <div>
              <span>Open Tickets</span>

              <strong>{openTickets}</strong>
            </div>

          </div>

          {/* In Progress */}

          <div className="stat-card">

            <div className="stat-icon">
              <AlertCircle size={22} />
            </div>

            <div>
              <span>In Progress</span>

              <strong>{inProgressTickets}</strong>
            </div>

          </div>

          {/* Resolved */}

          <div className="stat-card">

            <div className="stat-icon">
              <CheckCircle size={22} />
            </div>

            <div>
              <span>Resolved</span>

              <strong>{resolvedTickets}</strong>
            </div>

          </div>

        </section>

        {/* ====================================================
            RECENT TICKETS
            ==================================================== */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>
              <h2>Recent Tickets</h2>

              <p>
                Your latest support requests
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >

              <button
                className="agent-refresh-button"
                onClick={refreshDashboard}
              >
                <RefreshCw size={17} />

                Refresh
              </button>

              <button
                className="view-all-button"
                onClick={() =>
                  navigate("/customer/tickets")
                }
              >
                View All

                <ArrowRight size={17} />
              </button>

            </div>

          </div>

          {/* ==================================================
              NO TICKETS
              ================================================== */}

          {tickets.length === 0 ? (

            <div className="empty-tickets">

              <div className="empty-icon">
                <Ticket size={30} />
              </div>

              <h3>No tickets yet</h3>

              <p>
                You haven't created any support tickets.
              </p>

              <button
                className="create-ticket-button"
                onClick={() =>
                  navigate(
                    "/customer/create-ticket"
                  )
                }
              >
                <PlusCircle size={18} />

                Create Your First Ticket
              </button>

            </div>

          ) : (

            /* =================================================
               RECENT TICKET LIST
               ================================================= */

            <div className="agent-ticket-list">

              {tickets
                .slice(0, 5)
                .map((ticket) => (

                  <div
                    className="agent-ticket-card"
                    key={ticket.id}
                  >

                    <div className="agent-ticket-info">

                      <span className="agent-ticket-id">
                        Ticket #{ticket.id}
                      </span>

                      <h3>{ticket.title}</h3>

                      <p>
                        {ticket.description}
                      </p>

                      <div className="agent-ticket-meta">

                        <span>
                          Priority:{" "}
                          <strong>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1).toLowerCase()}
                          </strong>
                        </span>

                        <span>
                          Status:{" "}
                          <strong>
                            {ticket.status}
                          </strong>
                        </span>

                        <span>
                          Created:{" "}
                          {formatDate(
                            ticket.created_at
                          )}
                        </span>

                      </div>

                    </div>

                    <button
                      className="agent-view-button"
                      onClick={() =>
                        navigate(
                          `/customer/tickets/${ticket.id}`
                        )
                      }
                    >
                      View Ticket

                      <ArrowRight size={17} />
                    </button>

                  </div>

                ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default CustomerDashboard;