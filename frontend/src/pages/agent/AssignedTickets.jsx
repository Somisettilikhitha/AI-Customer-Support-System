import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Ticket,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  LayoutDashboard,
  UserPlus,
  Headphones,
  LogOut,
} from "lucide-react";

import api from "../../services/api";


function AssignedTickets() {

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigate = useNavigate();


  // ============================================================
  // STATE
  // ============================================================

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newlyAssignedIds, setNewlyAssignedIds] = useState([]);
  const [showNewTicketNotification, setShowNewTicketNotification] = useState(false);


  // ============================================================
  // GET ACCESS TOKEN
  // ============================================================

  const getToken = () => {

    return localStorage.getItem(
      "access_token"
    );

  };


  // ============================================================
  // FETCH ASSIGNED TICKETS
  // ============================================================

  const fetchAssignedTickets = async () => {

    const token = getToken();


    // ----------------------------------------------------------
    // If user is not logged in
    // ----------------------------------------------------------

    if (!token) {

      navigate("/login");

      return;

    }


    try {

      setLoading(true);

      setError("");


      // --------------------------------------------------------
      // Call backend
      //
      // GET /agent/tickets
      // --------------------------------------------------------

      const response = await api.get(
        "/agent/tickets",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );


      console.log(
        "Assigned tickets:",
        response.data
      );


      // --------------------------------------------------------
      // Store tickets
      // --------------------------------------------------------
      const fetchedTickets = Array.isArray(response.data)
        ? response.data
        : [];

      setTickets(fetchedTickets);

      // Get ticket IDs saved from Unassigned Tickets
      const savedIds = JSON.parse(
        localStorage.getItem("newly_assigned_ticket_ids") || "[]"
      );

      // Keep only IDs that are present in Assigned Tickets
      const matchingNewIds = savedIds.filter((id) =>
        fetchedTickets.some(
          (ticket) => String(ticket.id) === String(id)
        )
      );
      setNewlyAssignedIds(matchingNewIds);
      setShowNewTicketNotification(matchingNewIds.length > 0);


    } catch (error) {

      console.error(
        "Error loading assigned tickets:",
        error
      );


      // --------------------------------------------------------
      // Handle unauthorized
      // --------------------------------------------------------

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


      // --------------------------------------------------------
      // Handle forbidden
      // --------------------------------------------------------

      if (
        error.response?.status === 403
      ) {

        setError(
          "Agent access required."
        );

        return;

      }


      // --------------------------------------------------------
      // Other errors
      // --------------------------------------------------------

      setError(
        error.response?.data?.detail ||
        "Unable to load assigned tickets."
      );


    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // LOAD TICKETS WHEN PAGE OPENS
  // ============================================================

  useEffect(() => {

    fetchAssignedTickets();

  }, []);


  // ============================================================
  // FORMAT DATE
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
  // GET PRIORITY CLASS
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
  // GET STATUS CLASS
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


    if (value === "pending") {

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
        <CheckCircle
          size={15}
        />
      );

    }


    if (value === "pending") {

      return (
        <Clock
          size={15}
        />
      );

    }


    return (
      <AlertCircle
        size={15}
      />
    );

  };


  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {

    return (

      <div className="agent-loading">

        <RefreshCw
          size={30}
          className="loading-spinner"
        />

        <p>
          Loading assigned tickets...
        </p>

      </div>

    );

  }


  // ============================================================
  // MAIN UI
  // ============================================================

  return (

    <div className="agent-dashboard">


      {/* ======================================================
          SIDEBAR
          ====================================================== */}

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


          {/* Assigned Tickets */}

          <button
            className="agent-nav-item active"
          >

            <Ticket size={19} />

            <span>
              Assigned Tickets
            </span>

          </button>

          {/* Unassigned Tickets */}

          <button
            className="agent-nav-item"
            onClick={() =>
              navigate(
                "/agent/unassigned"
              )
            }
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
          MAIN CONTENT
          ====================================================== */}

      <main className="agent-main">


        {/* ====================================================
            HEADER
            ==================================================== */}

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

              <ArrowLeft
                size={17}
              />

              Back to Dashboard

            </button>


            <h1>
              Assigned Tickets
            </h1>

            <p>
              View and manage tickets assigned to you.
            </p>
            {showNewTicketNotification && (
              <div className="agent-new-ticket-notification-list">
                {newlyAssignedIds.map((id) => (
                  <div
                    className="agent-new-ticket-notification"
                    key={id}
                  >
                    <span classname="agent-notification-bell">
                      🔔
                    </span>
                    <span>
                      Ticket #{id} has been newly assigned to you!
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedIds = newlyAssignedIds.filter(
                          (ticketId) => String(ticketId) !== String(id)
                        );
                        setNewlyAssignedIds(updatedIds);
                        localStorage.setItem(
                          "newly_assigned_ticket_ids",
                          JSON.stringify(updatedIds)
                        );
                        setShowNewTicketNotification(updatedIds.length > 0);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}

              </div>
            )}

          </div>


          {/* Refresh */}

          <button
            className="agent-refresh-button"
            onClick={
              fetchAssignedTickets
            }
          >

            <RefreshCw
              size={17}
            />

            Refresh

          </button>

        </div>


        {/* ====================================================
            ERROR
            ==================================================== */}

        {error && (

          <div className="agent-error">

            <AlertCircle
              size={19}
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* ====================================================
            TICKET COUNT
            ==================================================== */}

        <div className="assigned-ticket-summary">

          <div>

            <strong>
              {tickets.length}
            </strong>

            <span>
              Assigned Tickets
            </span>

          </div>

        </div>


        {/* ====================================================
            NO TICKETS
            ==================================================== */}

        {tickets.length === 0 ? (

          <section className="agent-tickets-section">

            <div className="agent-empty">

              <Ticket
                size={42}
              />

              <h3>
                No assigned tickets
              </h3>

              <p>
                You don't have any tickets assigned
                to you yet.
              </p>

            </div>

          </section>

        ) : (


          /* =================================================
             TICKET LIST
             ================================================= */

          <section className="agent-ticket-list-page">

            {tickets.map(
              (ticket) => (

                <article
                  className="agent-full-ticket-card"
                  key={ticket.id}
                >


                  {/* =================================================
                      TOP SECTION
                      ================================================= */}

                  <div className="agent-ticket-top">


                    <div className="agent-ticket-title-area">

                      <div className="agent-ticket-icon">

                        <Ticket
                          size={21}
                        />

                      </div>


                      <div>

                        <span className="agent-ticket-id">

                          Ticket #{ticket.id}

                        </span>
                        {newlyAssignedIds.some(
                          (id) => String(id) === String(ticket.id)
                        ) && (
                          <span className="agent-new-badge">
                            NEW
                          </span>
                        )}

                        <h2>

                          {ticket.title}

                        </h2>

                      </div>

                    </div>


                    {/* Status */}

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


                  {/* =================================================
                      DESCRIPTION
                      ================================================= */}

                  <p className="agent-full-description">

                    {ticket.description}

                  </p>


                  {/* =================================================
                      INFORMATION
                      ================================================= */}

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

                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1).toLowerCase()}

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
                        Updated
                      </span>

                      <strong>

                        {formatDate(
                          ticket.updated_at
                        )}

                      </strong>

                    </div>


                  </div>


                  {/* =================================================
                      ACTION
                      ================================================= */}

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

                      <ArrowRight
                        size={17}
                      />

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


export default AssignedTickets;