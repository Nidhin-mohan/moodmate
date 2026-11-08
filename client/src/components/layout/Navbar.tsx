import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const MAIN_LINKS = [
  { name: "Home", path: "/dashboard" },
  { name: "Journal", path: "/mood-history" },
  { name: "Tools", path: "/tools" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn("text-[15px] transition-colors", isActive ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground");

function useCloseOnOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

const Navbar = () => {
  const { logout, isLoggedIn, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const menuRef = useCloseOnOutside(menuOpen, () => setMenuOpen(false));
  const avatarRef = useCloseOnOutside(avatarOpen, () => setAvatarOpen(false));

  // Close menus on navigation.
  useEffect(() => {
    setMenuOpen(false);
    setAvatarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const themeLabel = theme === "dark" ? "Light theme" : "Dark theme";

  const menuItem = "flex min-h-[48px] w-full items-center rounded-xl px-4 text-left text-[17px]";

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      aria-label="Main"
    >
      <div className="mx-auto flex h-14 max-w-[1040px] items-center justify-between px-4 md:h-16 md:px-8">
        <Link to={isLoggedIn ? "/dashboard" : "/"} className="font-serif text-xl font-semibold text-foreground">
          MoodMate
        </Link>

        {/* ── Desktop ── */}
        <div className="hidden items-center gap-8 md:flex">
          {isLoggedIn ? (
            <>
              {MAIN_LINKS.map((l) => (
                <NavLink key={l.path} to={l.path} className={linkClass}>
                  {l.name}
                </NavLink>
              ))}
              <Link
                to="/mood-tracking"
                className="inline-flex h-11 items-center rounded-full bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90"
              >
                Log mood
              </Link>
              <div className="relative" ref={avatarRef}>
                <button
                  type="button"
                  aria-label="Account menu"
                  aria-haspopup="menu"
                  aria-expanded={avatarOpen}
                  onClick={() => setAvatarOpen((o) => !o)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-soft font-medium text-soft-foreground"
                >
                  {initial}
                </button>
                {avatarOpen && (
                  <div role="menu" className="absolute right-0 top-12 w-56 rounded-2xl border border-border bg-popover p-2 shadow-lg">
                    <Link role="menuitem" to="/profile" className="flex min-h-[44px] items-center rounded-xl px-3 text-foreground hover:bg-accent">
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link role="menuitem" to="/admin/users" className="flex min-h-[44px] items-center rounded-xl px-3 text-foreground hover:bg-accent">
                        Admin
                      </Link>
                    )}
                    <button role="menuitem" type="button" onClick={toggleTheme} className="flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-foreground hover:bg-accent">
                      <ThemeIcon size={16} aria-hidden /> {themeLabel}
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button role="menuitem" type="button" onClick={handleLogout} className="flex min-h-[44px] w-full items-center rounded-xl px-3 text-muted-foreground hover:bg-accent hover:text-foreground">
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/tools" className={linkClass}>
                Tools
              </NavLink>
              <button type="button" onClick={toggleTheme} aria-label={themeLabel} className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent">
                <ThemeIcon size={18} />
              </button>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <Link to="/signup" className="inline-flex h-11 items-center rounded-full bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90">
                Start journaling
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile: hamburger ── */}
        <div className="md:hidden" ref={menuRef}>
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-foreground"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h10" />}
            </svg>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                id="mobile-menu"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="absolute left-0 right-0 top-full border-b border-border bg-card px-4 pb-4 pt-2 shadow-lg"
              >
                {isLoggedIn ? (
                  <>
                    {[...MAIN_LINKS, { name: "Profile", path: "/profile" }, ...(isAdmin ? [{ name: "Admin", path: "/admin/users" }] : [])].map((l) => (
                      <NavLink
                        key={l.path}
                        to={l.path}
                        className={({ isActive }) =>
                          cn(menuItem, isActive ? "bg-accent font-medium text-accent-foreground" : "text-foreground")
                        }
                      >
                        {l.name}
                      </NavLink>
                    ))}
                    <div className="my-2 h-px bg-border" />
                    <Link to="/tools#support" className={cn(menuItem, "text-[15px] text-muted-foreground")}>
                      Need support?
                    </Link>
                    <button type="button" onClick={toggleTheme} className={cn(menuItem, "gap-2 text-[15px] text-muted-foreground")}>
                      <ThemeIcon size={16} aria-hidden /> {themeLabel}
                    </button>
                    <button type="button" onClick={handleLogout} className={cn(menuItem, "text-[15px] text-muted-foreground")}>
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/tools" className={cn(menuItem, "text-foreground")}>
                      Tools
                    </NavLink>
                    <NavLink to="/login" className={cn(menuItem, "text-foreground")}>
                      Log in
                    </NavLink>
                    <Link to="/signup" className={cn(menuItem, "mt-1 justify-center bg-primary font-medium text-primary-foreground")}>
                      Start journaling
                    </Link>
                    <div className="my-2 h-px bg-border" />
                    <Link to="/tools#support" className={cn(menuItem, "text-[15px] text-muted-foreground")}>
                      Need support?
                    </Link>
                    <button type="button" onClick={toggleTheme} className={cn(menuItem, "gap-2 text-[15px] text-muted-foreground")}>
                      <ThemeIcon size={16} aria-hidden /> {themeLabel}
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
