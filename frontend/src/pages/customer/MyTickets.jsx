import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Ticket,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  LoaderCircle,
  Headphones,
} from "lucide-react";

import api from "../../services/api";


function MyTickets() {

  const navigate = useNavigate();

  // ============================================================
  // STATE
  // ============================================================

  // Stores all tickets returned from the backend
  const [tickets, setTickets] = useState([]);

  // Shows loading while fetching tickets
  const [loading, setLoading] = useState(true);

  // Stores any API error
  const [error, setError] = useState("");


  // ============================================================
  // GET CUSTOMER TICKETS
  // GET /tickets/
  // ============================================================

  useEffect(() => {

    const fetchTickets = async () => {

      // Get JWT token from browser storage
      const token = localStorage.getItem("access_token");

      // If token doesn't exist, send user to login
      if (!token) {
        navigate("/login");
        return;
      }

      try {

        setLoading(true);
        setError("");

        // Call FastAPI
        const response = await api.get(
          "/tickets/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(
          "Tickets received:",
          response.data
        );

        // Save tickets in React state
        setTickets(response.data);

      } catch (error) {

        console.error(
          "Unable to fetch tickets:",
          error
        );

        // If backend returns an error
        if (error.response) {

          // If token is invalid/expired
          if (
            error.response.status === 401
          ) {

            localStorage.removeItem(
              "access_token"
            );

            navigate("/login");

            return;
          }

          setError(
            error.response.data.detail ||
            "Unable to load tickets."
          );

        } else {

          setError(
            "Unable to connect to the backend."
          );
        }

      } finally {

        setLoading(false);

      }
    };


    fetchTickets();

  }, [navigate]);


  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "access_token"
    );

    navigate("/login");

  };


  // ============================================================
  // STATUS ICON
  // ============================================================

  const getStatusIcon = (status) => {

    const normalizedStatus =
      status?.toLowerCase();

    if (
      normalizedStatus === "resolved" ||
      normalizedStatus === "closed"
    ) {

      return (
        <CheckCircle
          size={17}
        />
      );

    }

    if (
      normalizedStatus === "pending"
    ) {

      return (
        <Clock
          size={17}
        />
      );

    }

    return (
      <AlertCircle
        size={17}
      />
    );
  };


  // ============================================================
  // STATUS CLASS
  // ============================================================

  const getStatusClass = (status) => {

    const normalizedStatus =
      status?.toLowerCase();

    if (
      normalizedStatus === "resolved" ||
      normalizedStatus === "closed"
    ) {
      return "ticket-status resolved";
    }

    if (
      normalizedStatus === "pending"
    ) {
      return "ticket-status pending";
    }

    return "ticket-status open";
  };


  // ============================================================
  // PRIORITY CLASS
  // ============================================================

  const getPriorityClass = (priority) => {

    const normalizedPriority =
      priority?.toLowerCase();

    if (
      normalizedPriority === "urgent"
    ) {
      return "ticket-priority urgent";
    }

    if (
      normalizedPriority === "high"
    ) {
      return "ticket-priority high";
    }

    if (
      normalizedPriority === "low"
    ) {
      return "ticket-priority low";
    }

    return "ticket-priority medium";
  };


  // ============================================================
  // DATE FORMATTER
  // ============================================================

  const formatDate = (date) => {

    if (!date) {
      return "N/A";
    }

    try {

      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    } catch {

      return "N/A";

    }
  };


  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {

    return (
      <div className="tickets-loading">

        <LoaderCircle
          size={30}
          className="loading-spinner"
        />

        <p>
          Loading your tickets...
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

            <LayoutDashboard
              size={19}
            />

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

            <PlusCircle
              size={19}
            />

            <span>
              Create Ticket
            </span>

          </button>

        </nav>


        {/* Logout */}
        <div className="sidebar-bottom">

          <button
            className="customer-logout-button"
            onClick={handleLogout}
          >

            <LogOut size={19} />

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
            PAGE HEADER
            ==================================================== */}

        <div className="dashboard-navbar">

          <div>

            <h2>
              My Tickets
            </h2>

            <p>
              View and manage your support tickets.
            </p>

          </div>


          {/* Create Ticket Button */}
          <button
            className="create-ticket-button"
            onClick={() =>
              navigate(
                "/customer/create-ticket"
              )
            }
          >

            <PlusCircle
              size={18}
            />

            Create Ticket

          </button>

        </div>


        {/* ====================================================
            ERROR MESSAGE
            ==================================================== */}

        {error && (

          <div className="tickets-error">

            <AlertCircle
              size={20}
            />

            <span>
              {error}
            </span>

          </div>

        )}


        {/* ====================================================
            NO TICKETS
            ==================================================== */}

        {!error &&
          tickets.length === 0 && (

          <div className="dashboard-section">

            <div className="empty-tickets">

              <div className="empty-icon">

                <Ticket
                  size={30}
                />

              </div>

              <h3>
                No tickets yet
              </h3>

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

                <PlusCircle
                  size={18}
                />

                Create Your First Ticket

              </button>

            </div>

          </div>

        )}


        {/* ====================================================
            TICKET LIST
            ==================================================== */}

        {tickets.length > 0 && (

          <div className="tickets-list">

            {tickets.map((ticket) => (

              <div
                className="ticket-card"
                key={ticket.id}
              >

                {/* --------------------------------------------
                    Ticket Header
                    -------------------------------------------- */}

                <div className="ticket-card-header">

                  <div className="ticket-title-section">

                    <div className="ticket-icon">

                      <Ticket
                        size={20}
                      />

                    </div>

                    <div>

                      <h3>
                        {ticket.title}
                      </h3>

                      <span className="ticket-id">
                        Ticket #{ticket.id}
                      </span>

                    </div>

                  </div>


                  {/* Status */}
                  <div
                    className={getStatusClass(
                      ticket.status
                    )}
                  >

                    {getStatusIcon(
                      ticket.status
                    )}

                    {ticket.status}

                  </div>

                </div>


                {/* --------------------------------------------
                    Description
                    -------------------------------------------- */}

                <p className="ticket-description">

                  {ticket.description}

                </p>


                {/* --------------------------------------------
                    Ticket Information
                    -------------------------------------------- */}

                <div className="ticket-card-info">


                  {/* Priority */}
                  <div>

                    <span>
                      Priority
                    </span>

                    <strong
                      className={getPriorityClass(ticket.priority)}
                    >
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1).toLowerCase()}
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


                  {/* Created */}
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


                  {/* Updated */}
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


                {/* --------------------------------------------
                    View Ticket Button
                    -------------------------------------------- */}

                <div className="ticket-card-footer">

                  <button
                    className="view-ticket-button"
                    onClick={() =>
                      navigate(
                        `/customer/tickets/${ticket.id}`
                      )
                    }
                  >

                    <Eye
                      size={17}
                    />

                    View Details

                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}


export default MyTickets;