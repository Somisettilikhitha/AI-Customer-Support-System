import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Ticket,
  Send,
  LoaderCircle,
  AlertCircle,
  Bot,
  User,
  RefreshCw,
  Headphones,
} from "lucide-react";

import api from "../../services/api";

function TicketDetails() {
  // ============================================================
  // ROUTER
  // ============================================================

  const navigate = useNavigate();
  const { ticketId } = useParams();

  // ============================================================
  // STATE
  // ============================================================

  // Selected ticket
  const [ticket, setTicket] = useState(null);

  // Conversation messages
  const [messages, setMessages] = useState([]);

  // Customer's new message
  const [newMessage, setNewMessage] = useState("");

  // Ticket loading state
  const [loadingTicket, setLoadingTicket] = useState(true);

  // Messages loading state
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Sending message state
  const [sendingMessage, setSendingMessage] = useState(false);

  // Prevent duplicate message submissions
  const sendingMessageRef = useRef(false);

  // AI re-analysis state
  const [reanalyzing, setReanalyzing] = useState(false);

  // Error message
  const [error, setError] = useState("");

  // Success message
  const [success, setSuccess] = useState("");

  // ============================================================
  // GET AUTH TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  // ============================================================
  // GET TICKET DETAILS
  //
  // GET /tickets/{ticket_id}
  // ============================================================

  const fetchTicket = async () => {
    const token = getToken();

    // User is not logged in
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoadingTicket(true);
      setError("");

      const response = await api.get(`/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Ticket details:", response.data);

      setTicket(response.data);
    } catch (error) {
      console.error("Unable to load ticket:", error);

      // Authentication error
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Unable to load ticket."
      );
    } finally {
      setLoadingTicket(false);
    }
  };

  // ============================================================
  // GET CONVERSATION MESSAGES
  //
  // GET /tickets/{ticket_id}/messages
  // ============================================================

  const fetchMessages = async () => {
    const token = getToken();

    // User is not logged in
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoadingMessages(true);

      const response = await api.get(
        `/tickets/${ticketId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Messages:", response.data);

      setMessages(response.data);
    } catch (error) {
      console.error(
        "Unable to load messages:",
        error
      );

      // Authentication error
      if (error.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.detail ||
          "Unable to load conversation."
      );
    } finally {
      setLoadingMessages(false);
    }
  };

  // ============================================================
  // LOAD TICKET + MESSAGES
  // ============================================================

  useEffect(() => {
    if (!ticketId) {
      navigate("/customer/tickets");
      return;
    }

    fetchTicket();
    fetchMessages();
  }, [ticketId]);

  // ============================================================
  // SEND CUSTOMER MESSAGE
  //
  // POST /tickets/{ticket_id}/messages
  //
  // Backend flow:
  //
  // Customer message
  //       ↓
  // Save customer message
  //       ↓
  // RAG / AI
  //       ↓
  // Generate AI response
  //       ↓
  // Save AI message
  //
  // ============================================================

  const handleSendMessage = async (e) => {
    e.preventDefault();

    // ==========================================================
    // PREVENT DUPLICATE SUBMISSIONS
    // ==========================================================

    if (sendingMessageRef.current) {
      return;
    }

    sendingMessageRef.current = true;

    // ==========================================================
    // GET MESSAGE TEXT
    // ==========================================================

    const message = newMessage.trim();

    // Don't send empty message
    if (!message) {
      sendingMessageRef.current = false;
      return;
    }

    // ==========================================================
    // GET AUTH TOKEN
    // ==========================================================

    const token = getToken();

    if (!token) {
      sendingMessageRef.current = false;
      navigate("/login");
      return;
    }

    try {
      // ========================================================
      // START LOADING
      // ========================================================

      setSendingMessage(true);
      setError("");
      setSuccess("");

      // ========================================================
      // SEND CUSTOMER MESSAGE
      // ========================================================

      const response = await api.post(
        `/tickets/${ticketId}/messages`,
        {
          message: message,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ========================================================
      // DEBUG RESPONSE
      // ========================================================

      console.log(
        "Customer message response:",
        response.data
      );

      // ========================================================
      // REFRESH CONVERSATION
      //
      // The backend should now have:
      //
      // 1. Customer message
      // 2. AI message
      //
      // Fetch both messages again.
      // ========================================================

      await fetchMessages();

      // ========================================================
      // CLEAR MESSAGE INPUT
      // ========================================================

      setNewMessage("");

      // ========================================================
      // SHOW SUCCESS MESSAGE
      // ========================================================

      setSuccess(
        "Message sent successfully."
      );

      // ========================================================
      // REFRESH TICKET INFORMATION
      //
      // Useful if the backend changes ticket status.
      // ========================================================

      await fetchTicket();
    } catch (error) {
      // ========================================================
      // DEBUG ERROR
      // ========================================================

      console.error(
        "Unable to send message:",
        error
      );

      // ========================================================
      // AUTHENTICATION ERROR
      // ========================================================

      if (
        error.response?.status === 401
      ) {
        localStorage.removeItem(
          "access_token"
        );

        navigate("/login");
        return;
      }

      // ========================================================
      // DISPLAY BACKEND ERROR
      // ========================================================

      setError(
        error.response?.data?.detail ||
          "Unable to send message."
      );
    } finally {
      // ========================================================
      // STOP LOADING
      // ========================================================

      setSendingMessage(false);

      // Allow the next message to be sent
      sendingMessageRef.current = false;
    }
  };

  // ============================================================
  // RE-ANALYZE TICKET WITH AI
  //
  // POST /tickets/{ticket_id}/reanalyze
  // ============================================================

  const handleReanalyze = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setReanalyzing(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/tickets/${ticketId}/reanalyze`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "AI re-analysis:",
        response.data
      );

      setTicket(response.data);

      setSuccess(
        "AI analysis updated successfully."
      );
    } catch (error) {
      console.error(
        "AI re-analysis failed:",
        error
      );

      setError(
        error.response?.data?.detail ||
          "Unable to re-analyze ticket."
      );
    } finally {
      setReanalyzing(false);
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    try {
      const dateString = String(date);
      // Treat backend timestamps without timezone information as UTC.
      const utcDate =
      dateString.endsWith("Z") ||
      dateString.includes("+") ||
      /-\d{2}:\d{2}$/.test(dateString)
        ? dateString
        : `${dateString}Z`;

    return new Date(utcDate).toLocaleString(
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
  } catch {
    return "N/A";
  }
};

   
  // ============================================================
  // STATUS CSS CLASS
  // ============================================================

  const getStatusClass = (status) => {
    const value = status?.toLowerCase();

    if (
      value === "resolved" ||
      value === "closed"
    ) {
      return "detail-status resolved";
    }

    if (value === "pending") {
      return "detail-status pending";
    }

    return "detail-status open";
  };

  // ============================================================
  // PRIORITY CSS CLASS
  // ============================================================

  const getPriorityClass = (priority) => {
    const value = priority?.toLowerCase();

    if (value === "urgent") {
      return "detail-priority urgent";
    }

    if (value === "high") {
      return "detail-priority high";
    }

    if (value === "low") {
      return "detail-priority low";
    }

    return "detail-priority medium";
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loadingTicket) {
    return (
      <div className="tickets-loading">
        <LoaderCircle
          size={32}
          className="loading-spinner"
        />

        <p>
          Loading ticket details...
        </p>
      </div>
    );
  }

  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (
    <div className="customer-dashboard">
      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside className="dashboard-sidebar">
        {/* Logo */}

        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Headphones size={22} />
          </div>

          <div className="sidebar-logo-text">
            <strong>Customer Portal</strong>
            <small>Your Support Center</small>
          </div>
        </div>

        {/* Navigation */}

        <nav className="sidebar-nav">
          {/* Dashboard */}

          <button
            className="sidebar-item"
            onClick={() =>
              navigate(
                "/customer/dashboard"
              )
            }
          >
            <Ticket size={19} />

            <span>
              Dashboard
            </span>
          </button>

          {/* My Tickets */}

          <button
            className="sidebar-item active"
            onClick={() =>
              navigate(
                "/customer/tickets"
              )
            }
          >
            <Ticket size={19} />

            <span>
              My Tickets
            </span>
          </button>

          {/* Create Ticket */}

          <button
            className="sidebar-item"
            onClick={() =>
              navigate(
                "/customer/create-ticket"
              )
            }
          >
            <Send size={19} />

            <span>
              Create Ticket
            </span>
          </button>
        </nav>

        {/* Logout */}

        <div className="sidebar-bottom">
          <button
            className="sidebar-item"
            onClick={() => {
              localStorage.removeItem(
                "access_token"
              );

              navigate("/login");
            }}
          >
            <ArrowLeft size={19} />

            <span>
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}

      <main className="dashboard-main">
        {/* ====================================================
            BACK BUTTON
            ==================================================== */}

        <div className="ticket-details-top">
          <button
            className="back-button"
            onClick={() =>
              navigate(
                "/customer/tickets"
              )
            }
          >
            <ArrowLeft size={18} />

            Back to My Tickets
          </button>
        </div>

        {/* ====================================================
            ERROR MESSAGE
            ==================================================== */}

        {error && (
          <div className="tickets-error">
            <AlertCircle size={19} />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* ====================================================
            SUCCESS MESSAGE
            ==================================================== */}

        {success && (
          <div className="ticket-success">
            {success}
          </div>
        )}

        {/* ====================================================
            TICKET DATA
            ==================================================== */}

        {ticket && (
          <>
            {/* ==================================================
                TICKET INFORMATION
                ================================================== */}

            <div className="ticket-details-card">
              {/* Ticket header */}

              <div className="ticket-details-header">
                <div className="ticket-details-title">
                  <div className="ticket-details-icon">
                    <Ticket size={24} />
                  </div>

                  <div>
                    <span className="ticket-id">
                      Ticket #{ticket.id}
                    </span>

                    <h1>
                      {ticket.title}
                    </h1>
                  </div>
                </div>

                {/* Status */}

                <span
                  className={getStatusClass(
                    ticket.status
                  )}
                >
                  {ticket.status}
                </span>
              </div>

              {/* ==================================================
                  DESCRIPTION
                  ================================================== */}

              <div className="ticket-detail-section">
                <h3>
                  Description
                </h3>

                <p>
                  {ticket.description}
                </p>
              </div>

              {/* ==================================================
                  TICKET INFORMATION GRID
                  ================================================== */}

              <div className="ticket-detail-info-grid">
                {/* Priority */}

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

                {/* Category */}

                <div>
                  <span>
                    Category
                  </span>

                  <strong>
                    {ticket.category ||
                      "Not assigned"}
                  </strong>
                </div>

                {/* Sentiment */}

                <div>
                  <span>
                    Sentiment
                  </span>

                  <strong>
                    {ticket.sentiment ||
                      "Not available"}
                  </strong>
                </div>

                {/* AI Confidence */}

                <div>
                  <span>
                    AI Confidence
                  </span>

                  <strong>
                    {ticket.ai_confidence !==
                      null &&
                    ticket.ai_confidence !==
                      undefined
                      ? `${Math.round(
                          ticket.ai_confidence *
                            100
                        )}%`
                      : "N/A"}
                  </strong>
                </div>
              </div>

              {/* ==================================================
                  DATES
                  ================================================== */}

              <div className="ticket-detail-dates">
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

              {/* ==================================================
                  RE-ANALYZE BUTTON
                  ================================================== */}

              <div className="reanalyze-area">
                <button
                  className="reanalyze-button"
                  onClick={
                    handleReanalyze
                  }
                  disabled={reanalyzing}
                >
                  <RefreshCw size={17} />

                  {reanalyzing
                    ? "Analyzing..."
                    : "Re-analyze with AI"}
                </button>
              </div>
            </div>

            {/* ==================================================
                INITIAL AI RESPONSE
                ================================================== */}

            <div className="ai-response-card">
              <div className="ai-response-header">
                <div className="ai-avatar">
                  <Bot size={21} />
                </div>

                <div>
                  <h2>
                    AI Support Assistant
                  </h2>

                  <span>
                    Initial AI response
                  </span>
                </div>
              </div>

              <div className="ai-response-content">
                <p>
                  {ticket.ai_response ||
                    "No AI response is available for this ticket."}
                </p>
              </div>
            </div>

            {/* ==================================================
                CONVERSATION
                ================================================== */}

            <div className="conversation-card">
              {/* Conversation header */}

              <div className="conversation-header">
                <div>
                  <h2>
                    Conversation
                  </h2>

                  <p>
                    Messages related to this ticket
                  </p>
                </div>
              </div>

              {/* =================================================
                  MESSAGE LIST
                  ================================================= */}

              <div className="messages-container">
                {/* Loading */}

                {loadingMessages ? (
                  <div className="messages-loading">
                    <LoaderCircle
                      size={24}
                      className="loading-spinner"
                    />

                    <span>
                      Loading conversation...
                    </span>
                  </div>
                ) : messages.length === 0 ? (
                  /* No messages */

                  <div className="no-messages">
                    <Bot size={28} />

                    <p>
                      No messages yet.
                    </p>

                    <span>
                      Send a message to start the conversation.
                    </span>
                  </div>
                ) : (
                  /* Messages */

                  messages.map(
                    (
                      message,
                      index
                    ) => {
                      // Determine sender

                      const isCustomer =
                        message.sender_role ===
                        "customer";

                      return (
                        <div
                          key={
                            message.id ||
                            index
                          }
                          className={
                            isCustomer
                              ? "message-row customer-message"
                              : "message-row agent-message"
                          }
                        >
                          {/* Avatar */}

                          <div className="message-avatar">
                            {isCustomer ? (
                              <User
                                size={17}
                              />
                            ) : (
                              <Bot
                                size={17}
                              />
                            )}
                          </div>

                          {/* Message content */}

                          <div className="message-content">
                            {/* Message header */}

                            <div className="message-header">
                              <strong>
                                {isCustomer
                                  ? "You"
                                  : message.sender_role ===
                                      "ai"
                                    ? "AI Support"
                                    : "Support"}
                              </strong>

                              <span>
                                {formatDate(
                                  message.created_at
                                )}
                              </span>
                            </div>

                            {/* Message bubble */}

                            <div className="message-bubble">
                              {message.message}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>

              {/* ==================================================
                  SEND MESSAGE FORM
                  ================================================== */}

              <form
                className="message-form"
                onSubmit={
                  handleSendMessage
                }
              >
                {/* Message input */}

                <textarea
                  value={newMessage}
                  onChange={(e) =>
                    setNewMessage(
                      e.target.value
                    )
                  }
                  placeholder="Type your message..."
                  rows={3}
                  disabled={
                    sendingMessage
                  }
                />

                {/* Send button */}

                <button
                  type="submit"
                  className="send-message-button"
                  disabled={
                    sendingMessage ||
                    !newMessage.trim()
                  }
                >
                  <Send size={18} />

                  {sendingMessage
                    ? "Sending..."
                    : "Send"}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default TicketDetails;