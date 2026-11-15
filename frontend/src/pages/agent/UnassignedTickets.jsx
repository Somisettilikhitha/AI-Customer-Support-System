import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Ticket,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  UserPlus,
  LayoutDashboard,
  Headphones,
  LogOut,
} from "lucide-react";

import api from "../../services/api";


function UnassignedTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  


  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {

    return localStorage.getItem(
      "access_token"
    );

  };


  // ============================================================
  // FETCH UNASSIGNED TICKETS
  // ============================================================

  const fetchUnassignedTickets = async () => {

    const token = getToken();

    if (!token) {

      navigate("/login");

      return;

    }


    try {

      setLoading(true);

      setError("");


      const response = await api.get(
        "/agent/tickets/unassigned",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      console.log(
        "Unassigned tickets:",
        response.data
      );


      setTickets(
        Array.isArray(response.data)
          ? response.data
          : []
      );


    } catch (error) {

      console.error(
        "Unable to load unassigned tickets:",
        error
      );


      if (
        error.response?.status === 401
      ) {

        localStorage.removeItem(
          "access_token"
        );

        localStorage.removeItem(
          "user"
        );

        navigate("/login");

        return;

      }


      setError(
        error.response?.data?.detail ||
        "Unable to load unassigned tickets."
      );


    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // LOAD
  // ============================================================

  useEffect(() => {

    fetchUnassignedTickets();

  }, []);


  // ============================================================
  // ASSIGN TICKET TO CURRENT AGENT
  // ============================================================

  const handleAssignTicket = async (
    ticketId
  ) => {

    const token = getToken();

    if (!token) {

      navigate("/login");

      return;

    }


    try {

      setAssigningId(ticketId);

      setError("");


      const response = await api.put(
        `/agent/tickets/${ticketId}/assign`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const newlyAssignedIds = JSON.parse(
        localStorage.getItem("newly_assigned_ticket_ids") || "[]"
      );

      if (!newlyAssignedIds.some(
        (id) => String(id) === String(ticketId)
      )) {
        newlyAssignedIds.push(ticketId);

        localStorage.setItem(
          "newly_assigned_ticket_ids",
          JSON.stringify(newlyAssignedIds)
        );
      }


      console.log(
        "Ticket assigned:",
        response.data
      );
      setSuccessMessage( `Ticket #${ticketId} assigned successfully! You can view it under Assigned Tickets.`);

      // Remove ticket from unassigned list
      setTickets(
        (previousTickets) =>
          previousTickets.filter(
            (ticket) =>
              ticket.id !== ticketId
          )
      );


    } catch (error) {

      console.error(
        "Unable to assign ticket:",
        error
      );


      setError(
        error.response?.data?.detail ||
        "Unable to assign ticket."
      );


    } finally {

      setAssigningId(null);

    }

  };


  // ============================================================
  // DATE
  // ============================================================

  const formatDate = (date) => {

    if (!date) {

      return "N/A";

    }


    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  // ============================================================
  // PRIORITY CLASS
  // ============================================================

  const getPriorityClass = (
    priority
  ) => {

    const value =
      priority?.toLowerCase();


    if (value === "high") {

      return "priority-high";

    }


    if (value === "low") {

      return "priority-low";

    }


    return "priority-medium";

  };


  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (
    status
  ) => {

    const value =
      status?.toLowerCase();


    if (
      value === "resolved" ||
      value === "closed"
    ) {

      return "status-resolved";

    }


    if (
      value === "pending" ||
      value === "in_progress"
    ) {

      return "status-pending";

    }


    return "status-open";

  };


  // ============================================================
  // STATUS ICON
  // ============================================================

  const StatusIcon = ({
    status,
  }) => {

    const value =
      status?.toLowerCase();


    if (
      value === "resolved" ||
      value === "closed"
    ) {

      return (
        <CheckCircle size={15} />
      );

    }


    if (
      value === "pending" ||
      value === "in_progress"
    ) {

      return (
        <Clock size={15} />
      );

    }


    return (
      <AlertCircle size={15} />
    );

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

        <p>
          Loading unassigned tickets...
        </p>

      </div>

    );

  }


  // ============================================================
  // UI
  // ============================================================

  return (

    <div className="agent-dashboard">


      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside className="agent-sidebar">

        <div className="agent-logo">

          <div className="agent-logo-icon">

            <Headphones size={22} />

          </div>
          <div className="agent-logo-text">
            <strong>Agent Portal</strong>
            <small>Customer Support Workspace</small>
          </div>

        </div>


        <nav className="agent-nav">

          {/* Dashboard */}

          <button
            className="agent-nav-item"
            onClick={() =>
              navigate(
                "/agent/dashboard"
              )
            }
          >

            <LayoutDashboard size={19} />

            <span>
              Dashboard
            </span>

          </button>


          {/* Assigned */}

          <button
            className="agent-nav-item"
            onClick={() =>
              navigate(
                "/agent/tickets"
              )
            }
          >

            <Ticket size={19} />

            <span>
              Assigned Tickets
            </span>

          </button>


          {/* Unassigned */}

          <button
            className="agent-nav-item active"
          >

            <UserPlus size={19} />

            <span>
              Unassigned Tickets
            </span>

          </button>

        </nav>
        <div className="agent-sidebar-bottom">
          <button
            className="agent-nav-item"
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("user");
              navigate("/login");
            }}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>

      </aside>


      {/* ======================================================
          MAIN
          ====================================================== */}

      <main className="agent-main">


        {/* HEADER */}

        <div className="agent-header">

          <div>

            <button
              className="agent-back-button"
              onClick={() =>
                navigate(
                  "/agent/dashboard"
                )
              }
            >

              <ArrowLeft size={17} />

              Back to Dashboard

            </button>


            <h1>
              Unassigned Tickets
            </h1>

            <p>
              View new tickets and assign them to yourself.
            </p>

          </div>


          <button
            className="agent-refresh-button"
            onClick={
              fetchUnassignedTickets
            }
            disabled={
              assigningId !== null
            }
          >

            <RefreshCw size={17} />

            Refresh

          </button>

        </div>


        {/* ERROR */}

        {error && (

          <div className="agent-error">

            <AlertCircle size={19} />

            <span>{error}</span>

          </div>

        )}
        {successMessage && (
          <div className="agent-success-toast">
            <CheckCircle size={19} />
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage("")}
              aria-label="Close notification"
            >
              ×
              </button>
            </div>
        )}


        {/* COUNT */}

        <div className="assigned-ticket-summary">

          <div>

            <strong>
              {tickets.length}
            </strong>

            <span>
              Unassigned Tickets
            </span>

          </div>

        </div>


        {/* EMPTY */}

        {tickets.length === 0 ? (

          <section className="agent-tickets-section">

            <div className="agent-empty">

              <CheckCircle size={42} />

              <h3>
                No unassigned tickets
              </h3>

              <p>
                All available tickets are currently assigned.
              </p>

            </div>

          </section>

        ) : (

          <section className="agent-ticket-list-page">

            {tickets.map(
              (ticket) => (

                <article
                  className="agent-full-ticket-card"
                  key={ticket.id}
                >

                  {/* TOP */}

                  <div className="agent-ticket-top">

                    <div className="agent-ticket-title-area">

                      <div className="agent-ticket-icon">

                        <Ticket size={21} />

                      </div>


                      <div>

                        <span className="agent-ticket-id">

                          Ticket #{ticket.id}

                        </span>


                        <h2>
                          {ticket.title}
                        </h2>

                      </div>

                    </div>


                    <div
                      className={`ticket-status ${getStatusClass(
                        ticket.status
                      )}`}
                    >

                      <StatusIcon
                        status={
                          ticket.status
                        }
                      />

                      {ticket.status}

                    </div>

                  </div>


                  {/* DESCRIPTION */}

                  <p className="agent-full-description">

                    {ticket.description}

                  </p>


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
                        {ticket.priority.charAt(0).toUpperCase() +
                          ticket.priority.slice(
                            1
                          ).toLowerCase()}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Category
                      </span>

                      <strong>
                        {ticket.category ||
                          "General"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Created
                      </span>

                      <strong>
                        {formatDate(
                          ticket.created_at
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        AI Confidence
                      </span>

                      <strong>
                        {ticket.ai_confidence
                          ? `${(
                              ticket.ai_confidence *
                              100
                            ).toFixed(1)}%`
                          : "N/A"}
                      </strong>

                    </div>

                  </div>


                  {/* AI RESPONSE */}

                  {ticket.ai_response && (

                    <div className="agent-ai-response">

                      <span>
                        AI Support Response
                      </span>

                      <p>
                        {ticket.ai_response}
                      </p>

                    </div>

                  )}


                  {/* ACTIONS */}

                  <div className="agent-ticket-actions">

                    <button
                      className="agent-view-button"
                      onClick={() =>
                        navigate(
                          `/agent/tickets/${ticket.id}`
                        )
                      }
                    >

                      View Ticket

                      <ArrowRight size={17} />

                    </button>


                    <button
                      className="agent-assign-button"
                      onClick={() =>
                        handleAssignTicket(
                          ticket.id
                        )
                      }
                      disabled={
                        assigningId ===
                        ticket.id
                      }
                    >

                      <UserPlus size={17} />

                      {assigningId ===
                      ticket.id
                        ? "Assigning..."
                        : "Assign to Me"}

                    </button>

                  </div>

                </article>

              )
            )}

          </section>

        )}

      </main>

    </div>

  );

}


export default UnassignedTickets;