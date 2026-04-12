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

// Semantic mood colors — kept as raw Tailwind because they carry meaning
const MOOD_COLORS: Record<string, string> = {
  Happy: "bg-green-500",
  Excited: "bg-yellow-500",
  Neutral: "bg-muted-foreground",
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

  const topMood = stats?.moodBreakdown
    ? Object.entries(stats.moodBreakdown).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—"
    : "—";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome Back{user?.name ? `, ${user.name}` : ""}!
            </h1>
            <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
              <Calendar size={15} className="text-primary" />
              {currentDate}
            </p>
          </div>
          <Link to="/mood-tracking">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-sm transition-transform active:scale-95">
              <Plus size={20} />
              Log Mood
            </Button>
          </Link>
        </div>

        {/* 2. Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-border shadow-sm bg-card rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-xl shrink-0">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Avg Intensity</p>
              <h3 className="text-2xl font-bold text-foreground">
                {stats?.avgIntensity ?? "—"}
                <span className="text-sm font-normal text-muted-foreground">/10</span>
              </h3>
            </div>
          </Card>

          <Card className="p-6 border-border shadow-sm bg-card rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-accent text-accent-foreground rounded-xl shrink-0">
              <Smile size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Top Mood</p>
              <h3 className="text-2xl font-bold text-foreground">{topMood}</h3>
            </div>
          </Card>

          <Card className="p-6 border-border shadow-sm bg-card rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-xl shrink-0">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Check-ins</p>
              <h3 className="text-2xl font-bold text-foreground">{stats?.totalLogs ?? 0}</h3>
            </div>
          </Card>
        </div>

        {/* 3. Main Content: Recent Activity + Insight */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent History List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
              <Link to="/mood-history" className="text-primary text-sm font-medium hover:underline">
                View All
              </Link>
            </div>

            {recentMoods.length === 0 ? (
              <div className="bg-card p-8 rounded-xl shadow-sm border border-border text-center">
                <Smile size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm mb-4">
                  No mood logs yet. Start tracking to see your history here.
                </p>
                <Link to="/mood-tracking">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    <Plus size={16} />
                    Log Your First Mood
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMoods.map((item) => (
                  <div
                    key={item._id}
                    className="bg-card p-4 rounded-xl shadow-sm border border-border flex items-center justify-between hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${MOOD_COLORS[item.mood] ?? "bg-muted-foreground"}`} />
                      <div>
                        <h4 className="font-medium text-foreground text-sm">
                          {item.mood}
                          {item.specificEmotion && (
                            <span className="font-normal text-muted-foreground ml-2">
                              · {item.specificEmotion}
                            </span>
                          )}
                        </h4>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.notes}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md whitespace-nowrap shrink-0 ml-4">
                      {formatDate(item.date ?? item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Insight Widget */}
          <div className="lg:col-span-1">
            <h2 className="text-base font-semibold text-foreground mb-4">Daily Insight</h2>
            <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground p-6 rounded-2xl shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <p className="font-medium text-primary-foreground/70 text-xs mb-2 uppercase tracking-wider">
                  Quote of the day
                </p>
                <blockquote className="text-base font-serif italic mb-4 leading-relaxed">
                  "Happiness is not something ready made. It comes from your own actions."
                </blockquote>
                <p className="text-right text-xs text-primary-foreground/60">— Dalai Lama</p>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
