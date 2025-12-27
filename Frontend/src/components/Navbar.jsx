import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const Navbar = ({ setSidebarOpen }) => {
  const getUserRole = () => {
    try {
      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;
      return user?.role || localStorage.getItem("role") || null;
    } catch {
      return localStorage.getItem("role") || null;
    }
  };

  const roleHome = () => {
    const r = getUserRole();
    if (r === "DATA_FIDUCIARY") return "/data-fiduciary";
    if (r === "DATA_PROCESSOR") return "/data-processor";
    if (r === "ADMIN") return "/admin";
    return "/data-principal";
  };
  return (
    <nav className="h-16 flex items-center justify-between   px-6 md:px-16 lg:px-24 xl:px-32 border-b border-gray-200 bg-white w-full">
      <Link to={roleHome()} className="flex items-center gap-3">
        <img src={logo} alt="Logo" className="w-10 h-auto object-contain" />

        <h1 className="text-xl font-semibold text-gray-800">
          Consent Management System
        </h1>
      </Link>

      <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">
        <input
          className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500"
          type="text"
          placeholder="Search Content"
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.836 10.615 15 14.695"
            stroke="#7A7B7D"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            clipRule="evenodd"
            d="M9.141 11.738c2.729-1.136 4.001-4.224 2.841-6.898S7.67.921 4.942 2.057C2.211 3.193.94 6.281 2.1 8.955s4.312 3.92 7.041 2.783"
            stroke="#7A7B7D"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <button
        onClick={() => setSidebarOpen?.(true)}
        aria-label="Open menu"
        className="sm:hidden p-2 rounded hover:bg-gray-100"
      >
        <svg
          width="21"
          height="15"
          viewBox="0 0 21 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="21" height="1.5" rx=".75" fill="#426287" />
          <rect x="8" y="6" width="13" height="1.5" rx=".75" fill="#426287" />
          <rect x="6" y="13" width="15" height="1.5" rx=".75" fill="#426287" />
        </svg>
      </button>
    </nav>
  );
};

export default Navbar;
