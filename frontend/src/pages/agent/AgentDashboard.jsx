import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  LogOut,
  ArrowRight,
  RefreshCw,
  UserPlus,
  Bell,
  CheckCheck,
  Headphones,
} from "lucide-react";

import api from "../../services/api";

function AgentDashboard() {
  const navigate = useNavigate();

  // ============================================================
  // STATE
  // ============================================================

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // ============================================================
  // GET TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  // ============================================================
  // FETCH ASSIGNED TICKETS
  // ============================================================

  const fetchTickets = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/agent/tickets",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Agent tickets:", response.data);
      setTickets(response.data);

    } catch (error) {
      console.error("Unable to load agent tickets:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.detail ||
        "Unable to load assigned tickets."
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FETCH NOTIFICATIONS
  // ============================================================

  const fetchNotifications = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setNotificationLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch notifications
      const notificationResponse = await api.get(
        "/notifications/",
        { headers }
      );

      setNotifications(notificationResponse.data);

      // Fetch unread count
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
  // MARK INDIVIDUAL NOTIFICATION AS READ
  // ============================================================

  const markNotificationAsRead = async (notificationId) => {
    const token = getToken();

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
    const token = getToken();

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
  // LOAD DATA
  // ============================================================

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ============================================================
  // CALCULATE STATISTICS
  // ============================================================

  const totalTickets = tickets.length;

  const assignedTickets = tickets.filter(
    (ticket) =>
      ticket.status?.toLowerCase() === "assigned"
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) =>
      ticket.status?.toLowerCase() === "in_progress"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status?.toLowerCase() === "resolved"
  ).length;

  const closedTickets = tickets.filter(
    (ticket) =>
      ticket.status?.toLowerCase() === "closed"
  ).length;

  const highPriorityTickets = tickets.filter(
    (ticket) =>
      ticket.priority?.toLowerCase() === "high"
  ).length;

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
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
      <div className="agent-loading">
        <RefreshCw
          size={30}
          className="loading-spinner"
        />

        <p>Loading agent dashboard...</p>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="agent-dashboard">

      {/* SIDEBAR */}

      <aside className="agent-sidebar">

        {/* Logo */}

        <div className="agent-logo">
          <div className="agent-logo-icon">
            <Headphones size={22} />
          </div>
          <div className="agent-logo-text">
            <strong>Agent Portal</strong>
            <small>Customer Support Workspace</small>
          </div>
        </div>

        {/* Navigation */}

        <nav className="agent-nav">

          <button
            className="agent-nav-item active"
            onClick={() => navigate("/agent/dashboard")}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </button>

          <button
            className="agent-nav-item"
            onClick={() => navigate("/agent/tickets")}
          >
            <Ticket size={19} />
            <span>Assigned Tickets</span>
          </button>

          <button
            className="agent-nav-item"
            onClick={() => navigate("/agent/unassigned")}
          >
            <UserPlus size={19} />
            <span>Unassigned Tickets</span>
          </button>

        </nav>

        {/* Logout */}

        <div className="agent-sidebar-bottom">
          <button
            className="agent-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT */}

      <main className="agent-main">

        {/* HEADER */}

        <div className="agent-header">

          <div>
            <h1>Agent Dashboard</h1>

            <p>
              Manage and respond to your assigned
              support tickets.
            </p>
          </div>

          {/* HEADER ACTIONS */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >

            {/* NOTIFICATION BELL */}

            <div style={{ position: "relative" }}>

              <button
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  const willOpen = !showNotifications;

                  setShowNotifications(willOpen);

                  if (willOpen) {
                    fetchNotifications();
                  }
                }}
                style={{
                  position: "relative",
                  width: "46px",
                  height: "46px",
                  border: "none",
                  borderRadius: "50%",
                  background: "#f1f2ff",
                  color: "#374151",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >

                <Bell size={21} />

                {/* UNREAD COUNT */}

                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      minWidth: "19px",
                      height: "19px",
                      padding: "0 4px",
                      borderRadius: "20px",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: "11px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}

              </button>

              {/* NOTIFICATION DROPDOWN */}

              {showNotifications && (
                <div
                  style={{
                    position: "absolute",
                    top: "55px",
                    right: "0",
                    width: "370px",
                    maxWidth: "calc(100vw - 32px)",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                    zIndex: 1000,
                    overflow: "hidden",
                  }}
                >

                  {/* DROPDOWN HEADER */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >

                    <strong style={{ fontSize: "17px" }}>
                      Notifications
                    </strong>

                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      disabled={unreadCount === 0}
                      style={{
                        border: "none",
                        background: "transparent",
                        color:
                          unreadCount === 0
                            ? "#9ca3af"
                            : "#2563eb",
                        cursor:
                          unreadCount === 0
                            ? "default"
                            : "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <CheckCheck size={15} />
                      Mark all as read
                    </button>

                  </div>

                  {/* NOTIFICATION LIST */}

                  <div
                    style={{
                      maxHeight: "420px",
                      overflowY: "auto",
                    }}
                  >

                    {notificationLoading ? (

                      <p
                        style={{
                          padding: "20px",
                          textAlign: "center",
                        }}
                      >
                        Loading notifications...
                      </p>

                    ) : notifications.length === 0 ? (

                      <p
                        style={{
                          padding: "25px",
                          textAlign: "center",
                          color: "#6b7280",
                        }}
                      >
                        No notifications available.
                      </p>

                    ) : (

                      notifications.map((notification) => (

                        <div
                          key={notification.id}
                          style={{
                            padding: "16px",
                            borderBottom: "1px solid #e5e7eb",
                            background: notification.is_read
                              ? "#fff"
                              : "#eff6ff",
                          }}
                        >

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >

                            <strong style={{ fontSize: "14px" }}>
                              {notification.title}
                            </strong>

                            {!notification.is_read && (
                              <span
                                style={{
                                  width: "9px",
                                  height: "9px",
                                  borderRadius: "50%",
                                  background: "#2563eb",
                                  flexShrink: 0,
                                }}
                              />
                            )}

                          </div>

                          <p
                            style={{
                              fontSize: "13px",
                              color: "#64748b",
                              margin: "8px 0",
                              lineHeight: "1.5",
                            }}
                          >
                            {notification.message}
                          </p>

                          {!notification.is_read && (

                            <button
                              type="button"
                              onClick={() =>
                                markNotificationAsRead(
                                  notification.id
                                )
                              }
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#2563eb",
                                cursor: "pointer",
                                padding: 0,
                                fontSize: "12px",
                              }}
                            >
                              Mark as read
                            </button>

                          )}

                        </div>

                      ))

                    )}

                  </div>

                </div>
              )}

            </div>

            {/* REFRESH BUTTON */}

            <button
              className="agent-refresh-button"
              onClick={fetchTickets}
            >
              <RefreshCw size={17} />
              Refresh
            </button>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="agent-error">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {/* STATISTICS */}

        <div className="agent-stats">

          {/* Total Tickets */}

          <div className="agent-stat-card">
            <div className="agent-stat-icon">
              <Ticket size={22} />
            </div>

            <div>
              <span>Total Tickets</span>
              <strong>{totalTickets}</strong>
            </div>
          </div>

          {/* Assigned */}

          <div className="agent-stat-card">
            <div className="agent-stat-icon">
              <UserPlus size={22} />
            </div>

            <div>
              <span>Assigned</span>
              <strong>{assignedTickets}</strong>
            </div>
          </div>

          {/* In Progress */}

          <div className="agent-stat-card">
            <div className="agent-stat-icon">
              <Clock size={22} />
            </div>

            <div>
              <span>In Progress</span>
              <strong>{inProgressTickets}</strong>
            </div>
          </div>

          {/* Resolved */}

          <div className="agent-stat-card">
            <div className="agent-stat-icon">
              <CheckCircle size={22} />
            </div>

            <div>
              <span>Resolved</span>
              <strong>{resolvedTickets}</strong>
            </div>
          </div>

          {/* Closed */}

          <div className="agent-stat-card">
            <div className="agent-stat-icon">
              <CheckCircle size={22} />
            </div>

            <div>
              <span>Closed</span>
              <strong>{closedTickets}</strong>
            </div>
          </div>

          {/* High Priority Tickets */}

          <div className="agent-stat-card">
            <div className="agent-stat-icon">
              <AlertTriangle size={22} />
            </div>

            <div>
              <span>High Priority Tickets</span>
              <strong>{highPriorityTickets}</strong>
            </div>
          </div>

        </div>

        {/* ASSIGNED TICKETS */}

        <section className="agent-tickets-section">

          <div className="agent-section-header">

            <div>
              <h2>Assigned Tickets</h2>

              <p>
                Tickets currently assigned to you.
              </p>
            </div>

            <button
              className="view-all-button"
              onClick={() => navigate("/agent/tickets")}
            >
              View All
              <ArrowRight size={17} />
            </button>

          </div>

          {/* NO TICKETS */}

          {tickets.length === 0 ? (

            <div className="agent-empty">

              <Ticket size={40} />

              <h3>No assigned tickets</h3>

              <p>
                You don't have any tickets assigned
                to you yet.
              </p>

            </div>

          ) : (

            /* TICKET LIST */

            <div className="agent-ticket-list">

              {tickets.slice(0, 5).map((ticket) => (

                <div
                  className="agent-ticket-card"
                  key={ticket.id}
                >

                  {/* TICKET INFORMATION */}

                  <div className="agent-ticket-info">

                    <span className="agent-ticket-id">
                      Ticket #{ticket.id}
                    </span>

                    <h3>{ticket.title}</h3>

                    <p>{ticket.description}</p>

                    <div className="agent-ticket-meta">

                      <span>
                        Priority:{" "}
                        <strong>{ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1).toLowerCase()}</strong>
                      </span>

                      <span>
                        Status:{" "}
                        <strong>{ticket.status}</strong>
                      </span>

                      <span>
                        Created:{" "}
                        {formatDate(ticket.created_at)}
                      </span>

                    </div>

                  </div>

                  {/* VIEW TICKET BUTTON */}

                  <button
                    className="agent-view-button"
                    onClick={() =>
                      navigate(`/agent/tickets/${ticket.id}`)
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

export default AgentDashboard;