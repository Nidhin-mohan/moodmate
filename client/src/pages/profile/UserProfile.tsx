import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

const ROLE_LABEL: Record<string, string> = { user: "Member", admin: "Admin", therapist: "Therapist" };

export default function UserProfile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your profile…</p>
      </div>
    );
  }

  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? "?";
  const row = "flex min-h-[56px] items-center justify-between gap-4 px-5 py-3";

  return (
    <div className="mx-auto max-w-[720px] px-4 pb-24 pt-6 sm:px-8 sm:pt-10">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-soft font-serif text-2xl text-soft-foreground">
          {initial}
        </span>
        <div>
          <h1 className="font-serif text-[28px] font-medium leading-tight text-foreground">{user.name}</h1>
          <p className="text-muted-foreground">{ROLE_LABEL[user.role ?? "user"] ?? "Member"}</p>
        </div>
      </div>

      <section className="mt-8" aria-labelledby="account-heading">
        <h2 id="account-heading" className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Account
        </h2>
        <dl className="divide-y divide-border rounded-3xl border border-border bg-card">
          <div className={row}>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate text-foreground">{user.email}</dd>
          </div>
          <div className={row}>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="text-foreground">{user.name}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-8" aria-labelledby="prefs-heading">
        <h2 id="prefs-heading" className="mb-2 text-[13px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Preferences
        </h2>
        <div className="divide-y divide-border rounded-3xl border border-border bg-card">
          <button type="button" onClick={toggleTheme} className={`${row} w-full text-left`}>
            <span className="text-foreground">Theme</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              {theme === "dark" ? <Moon size={16} aria-hidden /> : <Sun size={16} aria-hidden />}
              {theme === "dark" ? "Dark" : "Light"}
            </span>
          </button>
          <Link to="/tools#support" className={row}>
            <span className="text-foreground">Need support?</span>
            <span className="text-muted-foreground" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-10 h-12 w-full rounded-full border border-border text-foreground hover:bg-accent sm:w-auto sm:px-8"
      >
        Log out
      </button>
    </div>
  );
}
