import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { getAllMoodLogs, getMoodStats } from "@/services/moodLogService";
import type { MoodLog, MoodStatsResponse } from "@/services/moodLogService";
import {
  Plus,
  TrendingUp,
  Calendar,
  Smile,
  Activity,
  Loader2,
} from "lucide-react";

const MOOD_COLORS: Record<string, string> = {
  Happy: "bg-green-500",
  Excited: "bg-yellow-500",
  Neutral: "bg-slate-400",
  Sad: "bg-blue-500",
  Anxious: "bg-purple-500",
  Angry: "bg-red-500",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [recentMoods, setRecentMoods] = useState<MoodLog[]>([]);
  const [stats, setStats] = useState<MoodStatsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, statsRes] = await Promise.all([
          getAllMoodLogs({ page: 1, limit: 5 }),
          getMoodStats(30),
        ]);
        setRecentMoods(logsRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Derive top mood from breakdown
  const topMood = stats?.moodBreakdown
    ? Object.entries(stats.moodBreakdown).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—"
    : "—";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Welcome Back{user?.name ? `, ${user.name}` : ""}!
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <Calendar size={16} className="text-teal-600" />
              {currentDate}
            </p>
          </div>
          <Link to="/mood-tracking">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-200/50 transition-transform active:scale-95">
              <Plus size={20} />
              Log Mood
            </Button>
          </Link>
        </div>

        {/* 2. Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-none shadow-md bg-white rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Avg Intensity</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats?.avgIntensity ?? "—"}<span className="text-sm font-normal text-slate-400">/10</span></h3>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-md bg-white rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
              <Smile size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Top Mood</p>
              <h3 className="text-2xl font-bold text-slate-800">{topMood}</h3>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-md bg-white rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Check-ins</p>
              <h3 className="text-2xl font-bold text-slate-800">{stats?.totalLogs ?? 0}</h3>
            </div>
          </Card>
        </div>

        {/* 3. Main Content: Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent History List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
              <Link to="/mood-history" className="text-teal-600 text-sm font-medium hover:underline">View All</Link>
            </div>

            {recentMoods.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
                <Smile size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 mb-4">No mood logs yet. Start tracking to see your history here.</p>
                <Link to="/mood-tracking">
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                    <Plus size={16} />
                    Log Your First Mood
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMoods.map((item) => (
                  <div
                    key={item._id}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-teal-200 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${MOOD_COLORS[item.mood] ?? "bg-slate-400"}`} />
                      <div>
                        <h4 className="font-semibold text-slate-800">
                          {item.mood}
                          {item.specificEmotion && <span className="text-sm font-normal text-slate-400 ml-2">· {item.specificEmotion}</span>}
                        </h4>
                        {item.notes && <p className="text-sm text-slate-500 line-clamp-1">{item.notes}</p>}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md whitespace-nowrap">
                      {formatDate(item.date ?? item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Widget */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Daily Insight</h2>
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <p className="font-medium text-indigo-100 text-sm mb-2">Quote of the day</p>
                <blockquote className="text-lg font-serif italic mb-4">
                  "Happiness is not something ready made. It comes from your own actions."
                </blockquote>
                <p className="text-right text-sm text-indigo-200">- Dalai Lama</p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
