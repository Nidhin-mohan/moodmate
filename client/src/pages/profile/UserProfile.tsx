import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, Calendar, LogOut, Edit3 } from "lucide-react";

export default function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Page Header */}
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

        {/* Main Profile Card */}
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">

          {/* Banner */}
          <div className="h-28 bg-gradient-to-r from-primary to-primary/60" />

          <div className="px-8 pb-8">
            {/* Avatar Section */}
            <div className="relative -mt-12 mb-6 flex items-end justify-between">
              <div className="flex items-center gap-5">
                <div className="h-24 w-24 rounded-full bg-card p-1 shadow-md border border-border">
                  <div className="h-full w-full rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-2xl">
                    {getInitials(user.name)}
                  </div>
                </div>
                <div className="mb-2 hidden sm:block">
                  <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                  <p className="text-muted-foreground text-sm capitalize">{user.role || "Member"}</p>
                </div>
              </div>

              <Button
                variant="outline"
                className="gap-2 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Edit3 size={15} /> Edit Profile
              </Button>
            </div>

            {/* Mobile Name */}
            <div className="sm:hidden mb-6">
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <p className="text-muted-foreground text-sm capitalize">{user.role || "Member"}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="p-4 rounded-xl bg-muted border border-border flex items-start gap-3">
                <div className="p-2 bg-card rounded-lg text-primary shadow-sm shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Email Address</p>
                  <p className="text-foreground font-medium text-sm mt-0.5">{user.email}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted border border-border flex items-start gap-3">
                <div className="p-2 bg-card rounded-lg text-purple-600 shadow-sm shrink-0">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Account Role</p>
                  <p className="text-foreground font-medium text-sm mt-0.5 capitalize">{user.role || "User"}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted border border-border flex items-start gap-3">
                <div className="p-2 bg-card rounded-lg text-orange-500 shadow-sm shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Joined Date</p>
                  <p className="text-foreground font-medium text-sm mt-0.5">December 2025</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted border border-border flex items-start gap-3">
                <div className="p-2 bg-card rounded-lg text-muted-foreground shadow-sm shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">User ID</p>
                  <p className="text-foreground font-mono text-xs mt-1 break-all">
                    {user?._id || "N/A"}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="flex justify-end">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
          >
            <LogOut size={17} />
            Sign Out
          </Button>
        </div>

      </div>
    </div>
  );
}
