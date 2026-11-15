import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CreateTicket from "./pages/customer/CreateTicket";
import MyTickets from "./pages/customer/MyTickets";
import TicketDetails from "./pages/customer/TicketDetails";

import AgentDashboard from "./pages/agent/AgentDashboard";
import AssignedTickets from "./pages/agent/AssignedTickets";
import AgentTicketDetails from "./pages/agent/AgentTicketDetails";
import UnassignedTickets from "./pages/agent/UnassignedTickets";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageTickets from "./pages/admin/ManageTickets";
import ManageAgents from "./pages/admin/ManageAgents";

// ============================================================
// GET LOGGED-IN USER
// ============================================================

const getStoredUser = () => {
  try {
    const user = localStorage.getItem("user");

    if (!user) {
      return null;
    }

    return JSON.parse(user);
  } catch (error) {
    console.error(
      "Unable to read stored user:",
      error
    );

    return null;
  }
};

// ============================================================
// PROTECTED ROUTE
// ============================================================

function ProtectedRoute({ children }) {
  const token =
    localStorage.getItem("access_token");

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

// ============================================================
// ROLE PROTECTED ROUTE
// ============================================================

function RoleRoute({
  children,
  allowedRole,
}) {
  const token =
    localStorage.getItem("access_token");

  const user = getStoredUser();

  // Not logged in
  if (!token || !user) {
    localStorage.removeItem(
      "access_token"
    );
    
    localStorage.removeItem("user");

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // Check user role
  if (user.role !== allowedRole) {
    if (user.role === "admin") {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }
    if (user.role === "agent") {
      return (
        <Navigate
          to="/agent/dashboard"
          replace
        />
      );
    }
    if (user.role === "customer") {
      return (
        <Navigate
          to="/customer/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
}

// ============================================================
// APP
// ============================================================

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==================================================
            PUBLIC ROUTES
            ================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />
        
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* ==================================================
            CUSTOMER ROUTES
            ================================================== */}

        <Route
          path="/customer/dashboard"
          element={
            <RoleRoute allowedRole="customer">
              <CustomerDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/customer/create-ticket"
          element={
            <RoleRoute allowedRole="customer">
              <CreateTicket />
            </RoleRoute>
          }
        />

        <Route
          path="/customer/tickets"
          element={
            <RoleRoute allowedRole="customer">
              <MyTickets />
            </RoleRoute>
          }
        />

        <Route
          path="/customer/tickets/:ticketId"
          element={
            <RoleRoute allowedRole="customer">
              <TicketDetails />
            </RoleRoute>
          }
        />

        {/* ==================================================
            AGENT ROUTES
            ================================================== */}

        <Route
          path="/agent/dashboard"
          element={
            <RoleRoute allowedRole="agent">
              <AgentDashboard />
            </RoleRoute>
          }
        />

        <Route
          path="/agent/tickets"
          element={
            <RoleRoute allowedRole="agent">
              <AssignedTickets />
            </RoleRoute>
          }
        />

        <Route
          path="/agent/tickets/:ticketId"
          element={
            <RoleRoute allowedRole="agent">
              <AgentTicketDetails />
            </RoleRoute>
          }
        />

        <Route
          path="/agent/unassigned"
          element={
            <RoleRoute allowedRole="agent">
              <UnassignedTickets />
            </RoleRoute>
          }
        />

        {/* ==================================================
            ADMIN ROUTES
            ================================================== */}

        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allowedRole="admin">
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <RoleRoute allowedRole="admin">
              <ManageTickets />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/agents"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageAgents />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            UNKNOWN ROUTE
            ================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;