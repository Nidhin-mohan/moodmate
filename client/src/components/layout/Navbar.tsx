import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, Smile, User, History, Sparkles, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Integrating Auth Context

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const authNavLinks = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Mood Tracking", path: "/mood-tracking", icon: Smile },
    { name: "History", path: "/mood-history", icon: History },
    { name: "Tools", path: "/tools", icon: Sparkles },
    { name: "Profile", path: "/profile", icon: User },
  ];

  const publicNavLinks = [
    { name: "Tools", path: "/tools", icon: Sparkles },
  ];

  const navLinks = isLoggedIn ? authNavLinks : publicNavLinks;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">

        {/* Brand */}
        <Link
          to={isLoggedIn ? "/dashboard" : "/"}
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
          {isLoggedIn ? (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-slate-600 hover:text-red-600 hover:bg-red-50 gap-2"
            >
              <LogOut size={18} />
              Logout
            </Button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-slate-600 hover:text-teal-600 gap-2">
                  <LogIn size={18} />
                  Log In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                  <UserPlus size={18} />
                  Sign Up
                </Button>
              </Link>
            </>
          )}
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

          {isLoggedIn ? (
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start px-4 py-6 text-slate-600 hover:text-red-600 hover:bg-red-50 text-base font-medium"
            >
              <LogOut size={20} className="mr-3" />
              Logout
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start px-4 py-3 text-slate-600 text-base font-medium">
                  <LogIn size={20} className="mr-3" />
                  Log In
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full justify-start px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white text-base font-medium">
                  <UserPlus size={20} className="mr-3" />
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;