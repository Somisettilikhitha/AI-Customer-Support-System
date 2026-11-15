
import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import api from "../../services/api";
import "./AdminDashboard.css";

function ManageAgents() {
  const [agents, setAgents] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unassignedCount, setUnassignedCount] = useState(0);

  // Fetch agents and workload information
  const fetchAgentData = async () => {
    try {
      setLoading(true);
      setError("");

      const [agentsResponse, workloadResponse, unassignedResponse] = await Promise.all([
        api.get("/admin/agents"),
        api.get("/admin/agents/workload"),
        api.get("/admin/tickets/unassigned/count"),
      ]);

      const agentData = Array.isArray(agentsResponse.data)
        ? agentsResponse.data
        : [];

      const workloadData = Array.isArray(workloadResponse.data)
        ? workloadResponse.data
        : [];

      setAgents(agentData);
      setWorkloads(workloadData);

      setUnassignedCount(
        Number(unassignedResponse.data.unassigned_tickets) || 0
      );
    } catch (err) {
      console.error("Manage agents error:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load agent information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, []);

  // Match workload information with agent details
  const getAgentWorkload = (agentId) => {
    return workloads.find(
      (item) => Number(item.id) === Number(agentId)
    ) || {};
  };

  // Safely display numeric values
  const getCount = (value) => {
    const count = Number(value);
    return Number.isFinite(count) ? count : 0;
  };

  // Calculate totals
  const totalAssigned = workloads.reduce(
    (sum, item) => sum + getCount(item.assigned_tickets),
    0
  );

  const totalOpen = workloads.reduce(
    (sum, item) => sum + getCount(item.open_tickets),
    0
  );

  const totalInProgress = workloads.reduce(
    (sum, item) => sum + getCount(item.in_progress_tickets),
    0
  );

  const totalResolved = workloads.reduce(
    (sum, item) => sum + getCount(item.resolved_tickets),
    0
  );

  const totalClosed = workloads.reduce(
    (sum, item) => sum + getCount(item.closed_tickets),
    0
  );

  return (
    <div className="admin-dashboard">
      <AdminSidebar />

      <main className="admin-main">
        {/* Page Header */}
        <div className="admin-header manage-agents-header">
          <div>
            <h1>Manage Agents</h1>
            <p>
              View support agents and monitor their ticket workloads.
            </p>
          </div>

          <button
            type="button"
            className="agent-refresh-btn"
            onClick={fetchAgentData}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <p className="ticket-loading">Loading agent information...</p>
        )}

        {/* Error */}
        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary Cards */}
            <section className="agent-summary-grid">
              <div className="agent-summary-card">
                <span>Total Agents</span>
                <h2>{agents.length}</h2>
              </div>

              <div className="agent-summary-card">
                <span>Assigned Tickets</span>
                <h2>{totalAssigned}</h2>
              </div>

              <div className="agent-summary-card">
                <span>Unassigned Tickets</span>
                <h2>{unassignedCount}</h2>
              </div>

              <div className="agent-summary-card">
                <span>Open Tickets</span>
                <h2>{totalOpen}</h2>
              </div>

              <div className="agent-summary-card">
                <span>In Progress</span>
                <h2>{totalInProgress}</h2>
              </div>

              <div className="agent-summary-card">
                <span>Resolved Tickets</span>
                <h2>{totalResolved}</h2>
              </div>

              <div className="agent-summary-card">
                <span>Closed Tickets</span>
                <h2>{totalClosed}</h2>
              </div>
            </section>

            {/* Agents Table */}
            <section className="agent-table-container">
              <div className="agent-table-header">
                <div>
                  <h2>Support Agents</h2>
                  <p>
                    {agents.length} registered{" "}
                    {agents.length === 1 ? "agent" : "agents"}
                  </p>
                </div>
              </div>

              {agents.length === 0 ? (
                <p className="agent-empty">
                  No support agents found.
                </p>
              ) : (
                <div className="agent-table-scroll">
                  <table className="agent-table">
                    <thead>
                      <tr>
                        <th>Agent ID</th>
                        <th>Agent Details</th>
                        <th>Assigned</th>
                        <th>Open</th>
                        <th>In Progress</th>
                        <th>Resolved</th>
                        <th>Closed</th>
                      </tr>
                    </thead>

                    <tbody>
                      {agents.map((agent) => {
                        const workload = getAgentWorkload(agent.id);

                        return (
                          <tr key={agent.id}>
                            <td>
                              <strong>#{agent.id}</strong>
                            </td>

                            <td className="agent-details-cell">
                              <strong>{agent.name || "N/A"}</strong>
                              <p>{agent.email || "N/A"}</p>
                            </td>

                            <td>
                              <span className="agent-count assigned">
                                {getCount(workload.assigned_tickets)}
                              </span>
                            </td>

                            <td>
                              <span className="agent-count open">
                                {getCount(workload.open_tickets)}
                              </span>
                            </td>

                            <td>
                              <span className="agent-count in-progress">
                                {getCount(workload.in_progress_tickets)}
                              </span>
                            </td>

                            <td>
                              <span className="agent-count resolved">
                                {getCount(workload.resolved_tickets)}
                              </span>
                            </td>

                            <td>
                              <span className="agent-count closed">
                                {getCount(workload.closed_tickets)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Individual Workload Cards */}
            <section className="agent-workload-section">
              <div className="agent-workload-heading">
                <h2>Agent Workload Overview</h2>
                <p>
                  Ticket distribution for each support agent.
                </p>
              </div>

              {agents.length === 0 ? (
                <p className="agent-empty">
                  No agent workload information available.
                </p>
              ) : (
                <div className="agent-workload-grid">
                  {agents.map((agent) => {
                    const workload = getAgentWorkload(agent.id);

                    const assigned = getCount(
                      workload.assigned_tickets
                    );
                    const open = getCount(workload.open_tickets);
                    const inProgress = getCount(
                      workload.in_progress_tickets
                    );
                    const resolved = getCount(
                      workload.resolved_tickets
                    );
                    const closed = getCount(
                      workload.closed_tickets
                    );

                    return (
                      <article
                        className="agent-workload-card"
                        key={agent.id}
                      >
                        <div className="agent-workload-card-header">
                          <div className="agent-avatar">
                            {(agent.name || "A")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <h3>{agent.name || "Unnamed Agent"}</h3>
                            <p>{agent.email || "No email available"}</p>
                          </div>
                        </div>

                        <div className="agent-total-workload">
                          <span>Total Assigned Tickets</span>
                          <strong>{assigned}</strong>
                        </div>

                        <div className="agent-workload-details">
                          <div>
                            <span>Open</span>
                            <strong>{open}</strong>
                          </div>

                          <div>
                            <span>In Progress</span>
                            <strong>{inProgress}</strong>
                          </div>

                          <div>
                            <span>Resolved</span>
                            <strong>{resolved}</strong>
                          </div>

                          <div>
                            <span>Closed</span>
                            <strong>{closed}</strong>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default ManageAgents;
