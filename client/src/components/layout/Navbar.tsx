import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react"; // Icon library (lucide-react)

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-500 text-white shadow-lg">
      <Link to="/dashboard" className="text-3xl font-serif text-indigo-200">
        MoodMate
      </Link>

      {/* Hamburger button for smaller screens */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="lg:hidden p-2 text-indigo-200 rounded hover:bg-indigo-600"
        aria-label="Toggle navigation menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Desktop Menu */}
      <div
        className={`lg:flex items-center gap-6 ${
          isMenuOpen ? "flex flex-col mt-4 lg:mt-0 lg:flex-row" : "hidden"
        }`}
      >
        <Link
          to="/dashboard"
          className="text-lg hover:underline text-indigo-200 transition duration-300 ease-in-out"
        >
          Dashboard
        </Link>
        <Link
          to="/mood-tracking"
          className="text-lg hover:underline text-indigo-200 transition duration-300 ease-in-out"
        >
          Mood Tracking
        </Link>
        <Link
          to="/profile"
          className="text-lg hover:underline text-indigo-200 transition duration-300 ease-in-out"
        >
          Profile
        </Link>
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="bg-indigo-600 hover:bg-indigo-800 text-white px-6 py-2 rounded-full transition duration-300 ease-in-out"
        >
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
