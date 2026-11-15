import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Send,
  Ticket,
  AlertCircle,
  LayoutDashboard,
  PlusCircle,
  LogOut,
  Headphones,
} from "lucide-react";
import api from "../../services/api";

function CreateTicket() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Please enter a ticket title.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a ticket description.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/tickets",
        {
          title: title.trim(),
          description: description.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Ticket created:", response.data);

      setSuccess("Ticket created successfully!");

      setTitle("");
      setDescription("");

      setTimeout(() => {
        navigate("/customer/tickets");
      }, 1500);

    } catch (error) {
      console.error("Create ticket error:", error);

      if (error.response) {
        setError(
          error.response.data?.detail ||
          "Unable to create ticket."
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

  return (
    <div className="customer-dashboard">

      {/* Sidebar */}
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

          <button
            className="sidebar-item"
            onClick={() =>
              navigate("/customer/dashboard")
            }
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </button>

          <button
            className="sidebar-item"
            onClick={() =>
              navigate("/customer/tickets")
            }
          >
            <Ticket size={19} />
            <span>My Tickets</span>
          </button>

          <button
            className="sidebar-item active"
            onClick={() =>
              navigate("/customer/create-ticket")
            }
          >
            <Send size={19} />
            <span>Create Ticket</span>
          </button>

        </nav>

        <div className="sidebar-bottom">

          <button
            className="customer-logout-button"
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

      {/* Main Content */}
      <main className="dashboard-main">

        {/* Header */}
        <div className="dashboard-navbar">

          <div>
            <h2>Create Support Ticket</h2>

            <p>
              Tell us about the issue you are experiencing.
            </p>
          </div>

        </div>

        {/* Form */}
        <div className="ticket-form-card">

          <div className="ticket-form-header">

            <div className="ticket-form-icon">
              <Ticket size={24} />
            </div>

            <div>
              <h1>Submit a Ticket</h1>

              <p>
                Our AI support system will analyze your
                request and determine the appropriate
                category, priority, and sentiment.
              </p>
            </div>

          </div>

          {error && (
            <div className="ticket-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="ticket-success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Title */}
            <div className="ticket-form-group">

              <label htmlFor="title">
                Ticket Title
              </label>

              <input
                id="title"
                type="text"
                placeholder="Example: Unable to login to my account"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                maxLength={150}
                required
              />

            </div>

            {/* Description */}
            <div className="ticket-form-group">

              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                placeholder="Describe your issue in detail..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={8}
                required
              />

              <span className="character-count">
                {description.length} characters
              </span>

            </div>

            {/* Buttons */}
            <div className="ticket-form-actions">

              <button
                type="button"
                className="cancel-ticket-button"
                onClick={() =>
                  navigate("/customer/dashboard")
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="submit-ticket-button"
                disabled={loading}
              >
                <Send size={18} />

                {loading
                  ? "Creating Ticket..."
                  : "Create Ticket"}
              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}

export default CreateTicket;