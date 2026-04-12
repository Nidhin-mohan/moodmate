import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard, Smile, User, History, Sparkles, LogIn, UserPlus, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout, isLoggedIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

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
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">

        {/* Brand */}
        <Link
          to={isLoggedIn ? "/dashboard" : "/"}
          className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2"
        >
          <span className="text-primary">MoodMate</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <link.icon size={18} />
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isLoggedIn ? (
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2"
            >
              <LogOut size={18} />
              Logout
            </Button>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-primary gap-2">
                  <LogIn size={18} />
                  Log In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                  <UserPlus size={18} />
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Theme toggle + Hamburger */}
        <div className="lg:hidden flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full bg-card border-b border-border shadow-xl py-4 px-4 flex flex-col gap-2 animate-in slide-in-from-top-5 duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                isActive(link.path)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <link.icon size={20} />
              {link.name}
            </Link>
          ))}

          <div className="h-px bg-border my-2" />

          {isLoggedIn ? (
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start px-4 py-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-base font-medium"
            >
              <LogOut size={20} className="mr-3" />
              Logout
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start px-4 py-3 text-muted-foreground text-base font-medium">
                  <LogIn size={20} className="mr-3" />
                  Log In
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full justify-start px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-medium">
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
