import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/context/AuthContext";

// The dashboard hero and the log screen already are the quick log.
const NO_FAB = ["/dashboard", "/mood-tracking"];

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const { pathname } = useLocation();
  const showFab = isLoggedIn && !NO_FAB.includes(pathname);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="px-4 pb-8 pt-4 text-center text-xs text-muted-foreground">
        MoodMate is a self-reflection tool, not a substitute for professional care.{" "}
        <Link to="/tools#support" className="underline underline-offset-2 hover:text-foreground">
          Need support?
        </Link>
      </footer>

      {/* Phones: logging is one thumb-tap from anywhere (desktop has "Log mood" in the top bar). */}
      {showFab && (
        <Link
          to="/mood-tracking"
          aria-label="Log mood"
          className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
          style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <Plus size={26} aria-hidden />
        </Link>
      )}
    </div>
  );
};

export default Layout;
