import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, Calendar, LogOut, Edit3 } from "lucide-react";

export default function UserProfile() {
  // Correcting the context usage: 'user' holds data, 'logout' is the action
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();

  // Handle Logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Helper to get initials (e.g. "John Doe" -> "JD")
  const getInitials = (name : string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Fallback if user data isn't loaded yet
  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <p className="text-slate-500">Loading profile...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Page Header */}
        <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>

        {/* Main Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Header / Banner Background */}
            <div className="h-32 bg-gradient-to-r from-teal-500 to-sky-500 relative"></div>

            <div className="px-8 pb-8">
                {/* Avatar Section (overlapping the banner) */}
                <div className="relative -mt-12 mb-6 flex items-end justify-between">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg">
                            <div className="h-full w-full rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-2xl border border-slate-200">
                                {getInitials(user.name)}
                            </div>
                        </div>
                        <div className="mb-2 hidden sm:block">
                            <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
                            <p className="text-slate-500 text-sm">{user.role || "Member"}</p>
                        </div>
                    </div>
                    
                    <Button variant="outline" className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50">
                        <Edit3 size={16} /> Edit Profile
                    </Button>
                </div>

                {/* Mobile Name (Shown below avatar on small screens) */}
                <div className="sm:hidden mb-6">
                     <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
                     <p className="text-slate-500 text-sm">{user.role || "Member"}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Email Field */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg text-teal-600 shadow-sm">
                            <Mail size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Email Address</p>
                            <p className="text-slate-900 font-medium">{user.email}</p>
                        </div>
                    </div>

                    {/* Role Field */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
                            <Shield size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Account Role</p>
                            <p className="text-slate-900 font-medium capitalize">{user.role || "User"}</p>
                        </div>
                    </div>

                    {/* Member Since Field (Mock Data or from DB) */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg text-orange-600 shadow-sm">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Joined Date</p>
                            <p className="text-slate-900 font-medium">December 2025</p>
                        </div>
                    </div>

                    {/* Account ID */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg text-slate-600 shadow-sm">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">User ID</p>
                            <p className="text-slate-900 font-medium text-xs font-mono mt-1">
                                {user?._id || "N/A"}
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        {/* Danger Zone / Logout */}
        <div className="flex justify-end">
            <Button 
                onClick={handleLogout}
                variant="ghost" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2"
            >
                <LogOut size={18} />
                Sign Out
            </Button>
        </div>

      </div>
    </div>
  );
}