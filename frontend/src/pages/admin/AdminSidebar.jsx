
import { NavLink, useNavigate } from "react-router-dom";

import {
  ShieldCheck,
  LayoutDashboard,
  FolderOpen,
  LogOut,
  Users,
} from "lucide-react";

function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <aside className="admin-sidebar">

      <div className="admin-sidebar-top">

        <div className="admin-sidebar-brand">
          <div className="admin-brand-icon">
            <ShieldCheck size={25} />
          </div>

          <div>
            <h2>Admin Panel</h2>
            <p>Management Portal</p>
          </div>
        </div>

        <nav className="admin-sidebar-menu">

          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) =>
              `admin-menu-item ${isActive ? "active" : ""}`
            }
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/tickets"
            className={({ isActive }) =>
              `admin-menu-item ${isActive ? "active" : ""}`
            }
          >
            <FolderOpen size={20} />
            <span>Manage Tickets</span>
          </NavLink>
          
          <NavLink 
            to="/admin/agents" 
            className={({ isActive }) =>
              `admin-menu-item ${isActive ? "active" : ""}`
            }
          > 
            <Users size={20} />  
            <span>Manage Agents</span>
            
          </NavLink>

        </nav>
      </div>

      <button
        className="admin-sidebar-logout"
        onClick={handleLogout}
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>

    </aside>
  );
}

export default AdminSidebar;
