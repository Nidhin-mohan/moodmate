import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, Smile, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Integrating Auth Context

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout } = useAuth(); // Use the global logout function
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout(); // Clear context state
    navigate("/login");
  };

  // Helper to check if a link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Mood Tracking", path: "/mood-tracking", icon: Smile },
    { name: "Profile", path: "/profile", icon: User },
  ];

  return (
    // Sticky Navbar with Glassmorphism
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        
        {/* Brand */}
        <Link
          to="/dashboard"
          className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2"
        >
          <span className="text-teal-600">MoodMate</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? "text-teal-600"
                  : "text-slate-600 hover:text-teal-600"
              }`}
            >
              <link.icon size={18} />
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-slate-600 hover:text-red-600 hover:bg-red-50 gap-2"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md transition"
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-xl py-4 px-4 flex flex-col gap-2 animate-in slide-in-from-top-5 duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                isActive(link.path)
                  ? "bg-teal-50 text-teal-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <link.icon size={20} />
              {link.name}
            </Link>
          ))}
          
          <div className="h-px bg-slate-100 my-2" />

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start px-4 py-6 text-slate-600 hover:text-red-600 hover:bg-red-50 text-base font-medium"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;