 import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link, NavLink } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="font-bold text-lg">
            🚦 Traffic Dashboard
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex space-x-6 items-center">
            {user ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `hover:text-yellow-300 ${
                      isActive ? "font-semibold text-yellow-300" : ""
                    }`
                  }
                >
                  Dashboard
                </NavLink>
                <span className="text-sm">Hello, {user.name}</span>
                <button
                  onClick={logout}
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `hover:text-yellow-300 ${
                      isActive ? "font-semibold text-yellow-300" : ""
                    }`
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) =>
                    `hover:text-yellow-300 ${
                      isActive ? "font-semibold text-yellow-300" : ""
                    }`
                  }
                >
                  Register
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded hover:bg-blue-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {isOpen && (
        <div className="md:hidden bg-blue-700 px-4 pb-4 space-y-2">
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className="block hover:text-yellow-300"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </NavLink>
              <span className="block text-sm">Hello, {user.name}</span>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full text-left bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="block hover:text-yellow-300"
                onClick={() => setIsOpen(false)}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="block hover:text-yellow-300"
                onClick={() => setIsOpen(false)}
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

