import React, { useEffect, useState } from "react";

import {
  ArrowLeft,
  Send,
  Ticket,
  Bot,
  User,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  LayoutDashboard,
  LogOut,
  UserPlus,
  Headphones,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

export default function AgentTicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ==========================================================
  // STATE
  // ==========================================================

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPriority, setUpdatingPriority] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================================
  // AUTHENTICATION
  // ==========================================================

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      throw new Error(
        "Authentication token not found. Please sign in again."
      );
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // ==========================================================
  // FETCH TICKET
  // ==========================================================

  const fetchTicket = async () => {
    const response = await fetch(
      `${API_URL}/agent/tickets/${ticketId}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();

    console.log("Agent ticket response:", data);

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to load ticket."
      );
    }

    setTicket(data);
  };

  // ==========================================================
  // FETCH MESSAGES
  // ==========================================================

  const fetchMessages = async () => {
    const response = await fetch(
      `${API_URL}/agent/tickets/${ticketId}/messages`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    const data = await response.json();

    console.log("Agent messages response:", data);
    console.table(
      data.map((message) => ({
        id: message.id,
        sender_role: message.sender_role,
        message: message.message
      }))
    );

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to load messages."
      );
    }

    setMessages(
      Array.isArray(data) ? data : []
    );
  };

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchTicket(),
        fetchMessages(),
      ]);

    } catch (error) {
      console.error("Loading error:", error);

      setError(
        error.message || "Unable to load ticket."
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    if (!ticketId) {
      setError("Ticket ID is missing.");
      setLoading(false);
      return;
    }

    loadData();
  }, [ticketId]);

  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  const handleStatusChange = async (event) => {
    const newStatus = event.target.value;

    if (!newStatus || newStatus === "open") {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/agent/tickets/${ticketId}/status`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "Status update response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to update status."
        );
      }

      setTicket((previousTicket) => ({
        ...previousTicket,
        status: newStatus,
        updated_at: new Date().toISOString(),
      }));

      setSuccess(
        "Ticket status updated successfully."
      );

      await fetchTicket();

      setTimeout(() => {
        setSuccess("");
      }, 3000);

    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      setError(
        error.message ||
        "Unable to update status."
      );

    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==========================================================
  // UPDATE TICKET PRIORITY
  // ==========================================================

  const handlePriorityChange = async (event) => {
    const newPriority = event.target.value;

    if (!newPriority || newPriority === ticket.priority) {
      return;
    }

    try {
      setUpdatingPriority(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/agent/tickets/${ticketId}/priority`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            priority: newPriority,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to update priority."
        );
      }

      // Use the updated ticket returned by the backend.
      setTicket(data);

      setSuccess("Ticket priority updated successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3000);

    } catch (error) {
      console.error("Priority update error:", error);

      setError(
        error.message || "Unable to update priority."
      );

    } finally {
      setUpdatingPriority(false);
    }
  };

  // ==========================================================
  // SEND AGENT REPLY
  // ==========================================================

  const handleSendMessage = async () => {
    const messageText = newMessage.trim();

    if (!messageText) {
      setError(
        "Please type a message before sending."
      );
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      const token =
        localStorage.getItem("access_token");

      if (!token) {
        throw new Error(
          "Authentication token not found. Please sign in again."
        );
      }

      const url =
        `${API_URL}/agent/tickets/${ticketId}/messages`;

      const response = await fetch(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: messageText,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "POST response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Unable to send reply."
        );
      }

      setNewMessage("");

      setSuccess(
        "Reply sent successfully."
      );

      await fetchMessages();

      setTimeout(() => {
        setSuccess("");
      }, 3000);

    } catch (error) {
      console.error(
        "SEND REPLY ERROR:",
        error
      );

      setError(
        error.message ||
        "Unable to send reply."
      );

    } finally {
      setSending(false);
    }
  };

  // ==========================================================
  // STATUS CLASS
  // ==========================================================

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "status-open";

      case "assigned":
        return "status-open";

      case "in_progress":
        return "status-pending";

      case "resolved":
        return "status-resolved";

      case "closed":
        return "status-resolved";

      default:
        return "status-open";
    }
  };

  // ==========================================================
  // PRIORITY CLASS
  // ==========================================================

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "priority-high";

      case "medium":
        return "priority-medium";

      case "low":
        return "priority-low";

      default:
        return "";
    }
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString(
      "en-IN",
      {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="agent-loading">
        <RefreshCw
          size={30}
          className="loading-spinner"
        />

        <p>
          Loading ticket...
        </p>
      </div>
    );
  }

  // ==========================================================
  // TICKET NOT FOUND
  // ==========================================================

  if (!ticket) {
    return (
      <div className="agent-loading">
        <AlertCircle size={32} />

        <p>
          Ticket not found.
        </p>

        <button
          type="button"
          className="agent-view-button"
          onClick={() =>
            navigate("/agent/tickets")
          }
        >
          Back to Assigned Tickets
        </button>
      </div>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="agent-dashboard">

      {/* ======================================================
          LEFT SIDEBAR
      ====================================================== */}

      <aside className="agent-sidebar">

        {/* LOGO */}

        <div className="agent-logo">

          <div className="agent-logo-icon">
            <Headphones size={22} />
          </div>

          <div className="agent-logo-text">
            <strong>Agent Portal</strong>
            <small>Customer Support Workspace</small>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="agent-nav">

          <button
            className="agent-nav-item"
            onClick={() => navigate("/agent/dashboard")}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </button>

          <button
            className="agent-nav-item active"
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

        {/* LOGOUT */}

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

      {/* ======================================================
          RIGHT SIDE MAIN CONTENT
      ====================================================== */}

      <main className="agent-main">

        <div className="agent-ticket-details-page">

          {/* BACK */}

          <button
            type="button"
            className="agent-back-button"
            onClick={() =>
              navigate("/agent/tickets")
            }
          >
            <ArrowLeft size={17} />
            Back to Assigned Tickets
          </button>

          {/* ERROR */}

          {error && (
            <div className="agent-error">
              <AlertCircle size={18} />

              <span>
                {error}
              </span>
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="agent-success">
              <CheckCircle size={18} />

              <span>
                {success}
              </span>
            </div>
          )}

          {/* TICKET DETAILS */}

          <div className="agent-detail-card">

            <div className="agent-detail-header">

              <div className="agent-detail-title">

                <div className="agent-ticket-icon">
                  <Ticket size={24} />
                </div>

                <div>
                  <span>
                    Ticket #{ticket.id}
                  </span>

                  <h1>
                    {ticket.title}
                  </h1>
                </div>

              </div>

              <div
                className={`ticket-status ${getStatusClass(
                  ticket.status
                )}`}
              >
                {ticket.status === "resolved" ||
                ticket.status === "closed" ? (
                  <CheckCircle size={15} />
                ) : (
                  <Clock size={15} />
                )}

                {ticket.status === "in_progress"
                  ? "In Progress"
                  : ticket.status === "assigned"
                  ? "Assigned"
                  : ticket.status
                      ?.charAt(0)
                      .toUpperCase() +
                    ticket.status?.slice(1)}
              </div>

            </div>

            {/* DESCRIPTION */}

            <div className="agent-description">

              <h3>
                Description
              </h3>

              <p>
                {ticket.description}
              </p>

            </div>

            {/* META */}

            <div className="agent-full-meta">

              <div>
                <span>
                  Priority
                </span>

                <strong
                  className={getPriorityClass(
                    ticket.priority
                  )}
                >
                  {ticket.priority}
                </strong>
              </div>

              <div>
                <span>
                  Category
                </span>

                <strong>
                  {ticket.category}
                </strong>
              </div>

              <div>
                <span>
                  Sentiment
                </span>

                <strong>
                  {ticket.sentiment}
                </strong>
              </div>

              <div>
                <span>
                  AI Confidence
                </span>

                <strong>
                  {ticket.ai_confidence !== null &&
                  ticket.ai_confidence !== undefined
                    ? `${Math.round(
                        ticket.ai_confidence * 100
                      )}%`
                    : "N/A"}
                </strong>
              </div>

            </div>

            {/* DATES */}

            <div className="agent-detail-dates">

              <span>
                Created:{" "}
                {formatDate(
                  ticket.created_at
                )}
              </span>

              <span>
                Updated:{" "}
                {formatDate(
                  ticket.updated_at
                )}
              </span>

            </div>

            {/* STATUS */}

            <div className="agent-status-controls">

              <label htmlFor="ticket-status">
                Update Ticket Status
              </label>

              <select
                id="ticket-status"
                value={ticket.status || "open"}
                onChange={handleStatusChange}
                disabled={updatingStatus}
              >
                {ticket.status === "open" && (
                  <option value="open" disabled>
                    Open
                  </option>
                )}

                <option value="assigned">
                  Assigned
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="resolved">
                  Resolved
                </option>

                <option value="closed">
                  Closed
                </option>
              </select>

            </div>

          </div>

          {/* PRIORITY */}

          <div className="agent-status-controls">

            <label htmlFor="ticket-priority">
              Update Ticket Priority
            </label>

            <select
              id="ticket-priority"
              value={ticket.priority || "Medium"}
              onChange={handlePriorityChange}
              disabled={updatingPriority}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            {updatingPriority && (
              <span>Updating priority...</span>
            )}

          </div>

          {/* AI RESPONSE */}

          <div className="agent-detail-card">

            <div className="agent-card-heading">

              <div className="agent-ticket-icon">
                <Bot size={22} />
              </div>

              <div>
                <h2>
                  AI Support Assistant
                </h2>

                <p>
                  Initial AI response
                </p>
              </div>

            </div>

            <div className="agent-ai-response">
              {ticket.ai_response ||
                "No AI response available."}
            </div>

          </div>

          {/* CONVERSATION */}

          <div className="agent-detail-card">

            <div className="agent-card-heading">

              <div>
                <h2>
                  Conversation
                </h2>

                <p>
                  Messages related to this ticket
                </p>
              </div>

            </div>

            {/* MESSAGES */}

            <div className="agent-conversation">

              {messages.length === 0 ? (
                <div className="agent-empty">

                  <Bot size={34} />

                  <h3>
                    No messages yet
                  </h3>

                  <p>
                    Send a reply to start
                    the conversation.
                  </p>

                </div>
              ) : (
                messages.map((message) => {

                  const isAgent = message.sender_role === "agent";

                  const isAI = message.sender_role === "ai";

                  const isCustomer = message.sender_role === "customer";

                  return (
                    <div
                      key={message.id}
                      className={`agent-message ${
                        isAgent
                          ? "agent-message-right"
                          : isAI
                          ? "agent-message-ai"
                          : ""
                      }`}
                    >

                      <div className="agent-message-header">

                        <span className="agent-message-sender">

                          {isAI ? (
                            <Bot size={14} />

                          ) : isAgent ? (
                            <Bot size={14} />
                          ) : (
                            <User size={14} />
                          )}

                          {isAgent
                            ? "You"
                            : isAI
                            ? "AI Assistant"
                            : "Customer"}

                        </span>

                        <span>
                          {formatDate(
                            message.created_at
                          )}
                        </span>

                      </div>

                      <div className="agent-message-bubble">
                        {message.message}
                      </div>

                    </div>
                  );
                })
              )}

            </div>

            {/* REPLY AREA */}

            <div className="agent-reply-form">

              <textarea
                value={newMessage}
                onChange={(event) => {
                  setNewMessage(
                    event.target.value
                  );

                  if (error) {
                    setError("");
                  }
                }}
                placeholder="Type your reply to the customer..."
                rows={4}
                disabled={sending}
              />

              <button
                type="button"
                className="agent-view-button"
                onClick={handleSendMessage}
                disabled={sending}
              >
                <Send size={17} />

                {sending
                  ? "Sending..."
                  : "Send Reply"}
              </button>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}