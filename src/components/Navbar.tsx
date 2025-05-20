
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function Navbar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold text-nadi-600">
              Nadi Attendance
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === "/" 
                    ? "bg-nadi-600 text-white" 
                    : "text-gray-700 hover:bg-nadi-100"
                }`}
              >
                Home
              </Link>
              <Link
                to="/setup"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === "/setup" 
                    ? "bg-nadi-600 text-white" 
                    : "text-gray-700 hover:bg-nadi-100"
                }`}
              >
                Setup
              </Link>
              <Link
                to="/attendance"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === "/attendance" 
                    ? "bg-nadi-600 text-white" 
                    : "text-gray-700 hover:bg-nadi-100"
                }`}
              >
                Attendance & Reports
              </Link>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-nadi-500"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/" 
                  ? "bg-nadi-600 text-white" 
                  : "text-gray-700 hover:bg-nadi-100"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/setup"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/setup" 
                  ? "bg-nadi-600 text-white" 
                  : "text-gray-700 hover:bg-nadi-100"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Setup
            </Link>
            <Link
              to="/attendance"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === "/attendance" 
                  ? "bg-nadi-600 text-white" 
                  : "text-gray-700 hover:bg-nadi-100"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Attendance & Reports
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
