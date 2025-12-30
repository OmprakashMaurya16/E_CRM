import { X, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { getMenuByRole } from "./menuConfig";

const Sidebar = ({ open, setOpen }) => {
  const navigate = useNavigate();

  const getUserRole = () => {
    try {
      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;
      return user?.role || localStorage.getItem("role") || null;
    } catch {
      return localStorage.getItem("role") || null;
    }
  };

  const role = getUserRole();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setOpen(false);
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      isActive
        ? "bg-indigo-50 text-indigo-600"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <aside
      className={`fixed z-40 top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r-2 border-gray-100 px-4 py-6 transform transition-transform
      ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-medium text-gray-500 mx-3">MAIN MENU</h1>
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100"
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
          >
            <X />
          </button>
        </div>

        <nav className="space-y-2">
          {getMenuByRole(role).primary.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {getMenuByRole(role).secondary.length > 0 && (
          <div className="mt-10 border-t pt-6 space-y-2">
            {getMenuByRole(role).secondary.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        )}

        <div className="mt-auto border-t pt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
