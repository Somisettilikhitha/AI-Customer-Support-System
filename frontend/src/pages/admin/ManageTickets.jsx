import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import api from "../../services/api";
import "./AdminDashboard.css";

function ManageTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Agent assignment states
  const [agents, setAgents] = useState([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState({});
  const [assigningTicketId, setAssigningTicketId] = useState(null);
  const [assignmentError, setAssignmentError] = useState("");

  // Ticket priority update states
  const [selectedPriorities, setSelectedPriorities] = useState({});
  const [updatingPriorityTicketId, setUpdatingPriorityTicketId] = useState(null);
  const [priorityError, setPriorityError] = useState("");
  const [prioritySuccess, setPrioritySuccess] = useState("");

  // Activity history states
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fetch all tickets
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get("/admin/tickets");
        setTickets(response.data);
      } catch (err) {
        console.error("Manage tickets error:", err);
        setError(
          err.response?.data?.detail || "Unable to load tickets."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  // Fetch available agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await api.get("/admin/agents");
        setAgents(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching agents:", err);
        setAssignmentError(
          err.response?.data?.detail || "Unable to load agents."
        );
      }
    };

    fetchAgents();
  }, []);

  // Fetch activity history when a ticket is selected
  useEffect(() => {
    if (!selectedTicket?.id) {
      setActivities([]);
      setActivitiesError("");
      setActivitiesLoading(false);
      return;
    }

    let isActive = true;

    const fetchActivities = async () => {
      try {
        setActivitiesLoading(true);
        setActivitiesError("");
        setActivities([]);

        const response = await api.get(
          `/admin/tickets/${selectedTicket.id}/activities`
        );

        if (isActive) {
          setActivities(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (err) {
        console.error("Error fetching ticket activities:", err);

        if (isActive) {
          setActivitiesError(
            err.response?.data?.detail ||
              "Unable to load activity history."
          );
          setActivities([]);
        }
      } finally {
        if (isActive) {
          setActivitiesLoading(false);
        }
      }
    };

    fetchActivities();

    return () => {
      isActive = false;
    };
  }, [selectedTicket?.id]);

  // Format ticket date
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format activity date and time
  const formatActivityDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format activity action
  const formatActivityAction = (action) => {
    if (!action) return "Activity";

    return String(action)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Get unique ticket categories
  const categories = useMemo(() => {
    return [
      ...new Set(
        tickets
          .map((ticket) => ticket.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [tickets]);

  // Search and filter tickets
  const filteredTickets = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !search ||
        String(ticket.id || "").toLowerCase().includes(search) ||
        String(ticket.title || "").toLowerCase().includes(search) ||
        String(ticket.description || "").toLowerCase().includes(search) ||
        String(ticket.user_id || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        String(ticket.status || "").toLowerCase() === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        String(ticket.priority || "").toLowerCase() === priorityFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        ticket.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory
      );
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
  };

  // Assign or reassign agent
  const handleAssignAgent = async (ticketId) => {
    const agentId = selectedAgentIds[ticketId];

    if (!agentId) {
      setAssignmentError("Please select an agent first.");
      return;
    }

    try {
      setAssigningTicketId(ticketId);
      setAssignmentError("");

      await api.put(`/admin/tickets/${ticketId}/assign`, {
        agent_id: Number(agentId),
      });

      const response = await api.get("/admin/tickets");
      setTickets(response.data);

      setSelectedAgentIds((previous) => ({
        ...previous,
        [ticketId]: "",
      }));

    } catch (err) {
      console.error("Assignment error:", err);

      setAssignmentError(
        err.response?.data?.detail ||
          "Unable to assign ticket."
      );
    } finally {
      setAssigningTicketId(null);
    }
  };

  // Update ticket priority
  const handleUpdatePriority = async (ticketId) => {
    const ticket = tickets.find(
      (item) => item.id === ticketId
    );

    if (!ticket) return;

    const newPriority = selectedPriorities[ticketId];

    if (!newPriority) return;

    if (
      newPriority ===
      String(ticket.priority || "").toLowerCase()
    ) {
      return;
    }

    try {
      setUpdatingPriorityTicketId(ticketId);
      setPriorityError("");
      setPrioritySuccess("");

      await api.put(
        `/admin/tickets/${ticketId}/priority`,
        {
          priority: newPriority,
        }
      );

      // Refresh ticket list
      const response = await api.get("/admin/tickets");
      setTickets(response.data);

      // Update selected ticket in modal if open
      setSelectedTicket((previous) => {
        if (previous?.id === ticketId) {
          return {
            ...previous,
            priority: newPriority,
          };
        }

        return previous;
      });

      // Update selected priority state
      setSelectedPriorities((previous) => ({
        ...previous,
        [ticketId]: newPriority,
      }));

      setPrioritySuccess(
        `Ticket #${ticketId} priority updated successfully.`
      );

      // Refresh activity history if this ticket is open
      if (selectedTicket?.id === ticketId) {
        const activityResponse = await api.get(
          `/admin/tickets/${ticketId}/activities`
        );

        setActivities(
          Array.isArray(activityResponse.data)
            ? activityResponse.data
            : []
        );
      }

    } catch (err) {
      console.error("Priority update error:", err);

      setPriorityError(
        err.response?.data?.detail ||
          "Unable to update ticket priority."
      );
    } finally {
      setUpdatingPriorityTicketId(null);
    }
  };

  // Close ticket details modal
  const closeTicketModal = () => {
    setSelectedTicket(null);
    setActivities([]);
    setActivitiesError("");
    setPriorityError("");
    setPrioritySuccess("");
  };

  // Loading state
  if (loading) {
    return (
      <div className="admin-layout">
        <AdminSidebar />

        <main className="admin-main">
          <div className="admin-loading">
            Loading tickets...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">

      <AdminSidebar />

      <main className="admin-main manage-tickets-main">

        {/* Page Header */}
        <div className="admin-page-header">
          <div>
            <h1>Manage Tickets</h1>
            <p>
              View, search, filter, assign and manage support tickets.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {/* Assignment Messages */}
        {assignmentError && (
          <div className="admin-error">
            {assignmentError}
          </div>
        )}

        {/* Priority Messages */}
        {priorityError && (
          <div className="admin-error">
            {priorityError}
          </div>
        )}

        {prioritySuccess && (
          <div className="admin-success">
            {prioritySuccess}
          </div>
        )}

        {/* Search and Filters */}
        <div className="ticket-filter-section">

          <div className="ticket-search-box">
            <input
              type="text"
              placeholder="Search by ticket ID, title, description or customer ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="ticket-reset-btn"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>

        {/* Tickets Table */}
        <div className="ticket-table-container">

          <div className="ticket-table-header">
            <h2>All Tickets</h2>

            <span>
              Showing {filteredTickets.length} of {tickets.length} tickets
            </span>
          </div>

          <div className="ticket-table-scroll">

            <table className="ticket-table">

              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Ticket Details</th>
                  <th>Customer ID</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Agent</th>
                  <th>Created Date</th>
                </tr>
              </thead>

              <tbody>

                {filteredTickets.length > 0 ? (

                  filteredTickets.map((ticket) => (

                    <tr key={ticket.id}>

                      <td>
                        <strong>#{ticket.id}</strong>

                        <button
                          type="button"
                          className="ticket-view-btn"
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setPriorityError("");
                            setPrioritySuccess("");
                          }}
                        >
                          View Details
                        </button>
                      </td>

                      <td className="ticket-details-cell">
                        <strong>{ticket.title}</strong>
                        <p>{ticket.description}</p>
                      </td>

                      <td>#{ticket.user_id}</td>

                      <td>{ticket.category || "N/A"}</td>

                      {/* Ticket Priority */}
                    <td>
                      <span
                        className={`ticket-priority ${String(
                          ticket.priority || ""
                        ).toLowerCase()}`}
                      >
                        {ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) : "N/A"}
                      </span>
                    </td>

                      {/* Ticket Status */}
                      <td>
                        <span
                          className={`ticket-status ${String(
                            ticket.status || ""
                          )
                            .toLowerCase()
                            .replace(/_/g, "-")}`}
                        >
                          {ticket.status?.replace(/_/g, " ") || "N/A"}
                        </span>
                      </td>

                      {/* Agent Assignment */}
                      <td>

                        <div className="ticket-assignment-control">

                          <span className="assigned-agent-name">
                            {ticket.assigned_agent_id
                              ? agents.find(
                                  (agent) =>
                                    agent.id === ticket.assigned_agent_id
                                )?.name ||
                                `Agent #${ticket.assigned_agent_id}`
                              : "Unassigned"}
                          </span>

                          <select
                            value={
                              selectedAgentIds[ticket.id] || ""
                            }
                            onChange={(e) =>
                              setSelectedAgentIds((previous) => ({
                                ...previous,
                                [ticket.id]: e.target.value,
                              }))
                            }
                            disabled={
                              assigningTicketId === ticket.id
                            }
                          >
                            <option value="">Select Agent</option>

                            {agents.map((agent) => (
                              <option
                                key={agent.id}
                                value={agent.id}
                              >
                                {agent.name}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="ticket-assign-btn"
                            onClick={() =>
                              handleAssignAgent(ticket.id)
                            }
                            disabled={
                              !selectedAgentIds[ticket.id] ||
                              assigningTicketId === ticket.id
                            }
                          >
                            {assigningTicketId === ticket.id
                              ? "Assigning..."
                              : ticket.assigned_agent_id
                                ? "Reassign"
                                : "Assign Agent"}
                          </button>

                        </div>

                      </td>

                      <td>{formatDate(ticket.created_at)}</td>

                    </tr>

                  ))

                ) : (

                  <tr>
                    <td colSpan="8" className="ticket-empty">
                      No matching tickets found.
                    </td>
                  </tr>

                )}

              </tbody>

            </table>

          </div>
        </div>

      </main>

      {/* Ticket Details Modal */}
      {selectedTicket && (

        <div
          className="ticket-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeTicketModal();
            }
          }}
        >

          <div className="ticket-modal">

            {/* Modal Header */}
            <div className="ticket-modal-header">

              <div>
                <h2>Ticket Details</h2>
                <p>Ticket #{selectedTicket.id}</p>
              </div>

              <button
                type="button"
                className="ticket-modal-close"
                onClick={closeTicketModal}
                aria-label="Close ticket details"
              >
                ×
              </button>

            </div>

            <div className="ticket-modal-body">

              {/* Basic Information */}
              <div className="ticket-modal-section">

                <h3>Basic Information</h3>

                <div className="ticket-modal-grid">

                  <div>
                    <label>Ticket Title</label>
                    <p>{selectedTicket.title || "N/A"}</p>
                  </div>

                  <div>
                    <label>Customer ID</label>
                    <p>#{selectedTicket.user_id}</p>
                  </div>

                  <div>
                    <label>Category</label>
                    <p>{selectedTicket.category || "N/A"}</p>
                  </div>

                  {/* Priority Update in Modal */}
                  <div>

                    <label>Priority</label>

                    <p>{selectedTicket.priority ? selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1) : "N/A"}</p>

                    <div className="ticket-priority-control">

                      <select
                        aria-label={`Select priority for ticket ${selectedTicket.id}`}
                        value={
                          selectedPriorities[selectedTicket.id] ??
                          String(
                            selectedTicket.priority || "medium"
                          ).toLowerCase()
                        }
                        onChange={(e) =>
                          setSelectedPriorities((previous) => ({
                            ...previous,
                            [selectedTicket.id]: e.target.value,
                          }))
                        }
                        disabled={
                          updatingPriorityTicketId === selectedTicket.id
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>

                      <button
                        type="button"
                        className="ticket-assign-btn"
                        onClick={() =>
                          handleUpdatePriority(selectedTicket.id)
                        }
                        disabled={
                          updatingPriorityTicketId === selectedTicket.id ||
                          (
                            selectedPriorities[selectedTicket.id] ??
                            String(
                              selectedTicket.priority || "medium"
                            ).toLowerCase()
                          ) ===
                          String(
                            selectedTicket.priority || ""
                          ).toLowerCase()
                        }
                      >
                        {updatingPriorityTicketId === selectedTicket.id
                          ? "Updating..."
                          : "Update Priority"}
                      </button>

                    </div>

                  </div>

                  <div>
                    <label>Status</label>
                    <p>
                      {selectedTicket.status?.replace(/_/g, " ") || "N/A"}
                    </p>
                  </div>

                  <div>
                    <label>Assigned Agent</label>
                    <p>
                      {selectedTicket.assigned_agent_id
                        ? `Agent #${selectedTicket.assigned_agent_id}`
                        : "Unassigned"}
                    </p>
                  </div>

                </div>

              </div>

              {/* Issue Description */}
              <div className="ticket-modal-section">

                <h3>Issue Description</h3>

                <p>
                  {selectedTicket.description ||
                    "No description available."}
                </p>

              </div>

              {/* AI Analysis */}
              <div className="ticket-modal-section">

                <h3>AI Analysis</h3>

                <div className="ticket-modal-grid">

                  <div>
                    <label>Sentiment</label>
                    <p>{selectedTicket.sentiment || "N/A"}</p>
                  </div>

                  <div>
                    <label>AI Confidence</label>

                    <p>
                      {selectedTicket.ai_confidence != null
                        ? `${(
                            selectedTicket.ai_confidence * 100
                          ).toFixed(2)}%`
                        : "N/A"}
                    </p>
                  </div>

                </div>

                <label>AI Generated Response</label>

                <p>
                  {selectedTicket.ai_response ||
                    "No AI response available."}
                </p>

              </div>

              {/* Ticket Timeline */}
              <div className="ticket-modal-section">

                <h3>Timeline</h3>

                <div className="ticket-modal-grid">

                  <div>
                    <label>Created Date</label>
                    <p>{formatDate(selectedTicket.created_at)}</p>
                  </div>

                  <div>
                    <label>Last Updated</label>
                    <p>{formatDate(selectedTicket.updated_at)}</p>
                  </div>

                </div>

              </div>

              {/* Activity History */}
              <div className="activity-history-section">

                <div className="activity-history-header">

                  <div>
                    <h3 className="activity-history-heading">
                      Activity History
                    </h3>

                    <p className="activity-history-subtitle">
                      Record of actions performed on this ticket
                    </p>
                  </div>

                  <span className="activity-count">
                    {activities.length}{" "}
                    {activities.length === 1
                      ? "Activity"
                      : "Activities"}
                  </span>

                </div>

                {activitiesLoading && (
                  <p className="activity-empty">
                    Loading activity history...
                  </p>
                )}

                {activitiesError && (
                  <p className="activity-error">
                    {activitiesError}
                  </p>
                )}

                {!activitiesLoading &&
                  !activitiesError &&
                  activities.length === 0 && (
                    <p className="activity-empty">
                      No activity recorded for this ticket yet.
                    </p>
                  )}

                {!activitiesLoading &&
                  !activitiesError &&
                  activities.length > 0 && (

                    <div className="ticket-activity-list">

                      {activities.map((activity) => (

                        <article
                          className="ticket-activity-item"
                          key={activity.id}
                        >

                          <div className="activity-card-header">

                            <div className="activity-title-group">
                              <span className="activity-dot" />

                              <h4>
                                {formatActivityAction(activity.action)}
                              </h4>
                            </div>

                            <span className="activity-record-id">
                              #{activity.id}
                            </span>

                          </div>

                          <p className="activity-description">
                            {activity.description ||
                              "No description available."}
                          </p>

                          {(activity.old_value || activity.new_value) && (

                            <div className="activity-values">

                              {activity.old_value && (
                                <div className="activity-value-row">
                                  <span className="activity-value-label">
                                    Previous
                                  </span>

                                  <span className="activity-value-text">
                                    {activity.old_value}
                                  </span>
                                </div>
                              )}

                              {activity.new_value && (
                                <div className="activity-value-row">
                                  <span className="activity-value-label">
                                    New value
                                  </span>

                                  <span className="activity-value-text">
                                    {activity.new_value}
                                  </span>
                                </div>
                              )}

                            </div>

                          )}

                          <div className="activity-metadata">

                            <span>
                              User ID: {activity.user_id ?? "System"}
                            </span>

                            <span>
                              {formatActivityDate(activity.created_at)}
                            </span>

                          </div>

                        </article>

                      ))}

                    </div>

                  )}

              </div>

            </div>

            {/* Modal Footer */}
            <div className="ticket-modal-footer">

              <button
                type="button"
                className="ticket-modal-done-btn"
                onClick={closeTicketModal}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default ManageTickets;