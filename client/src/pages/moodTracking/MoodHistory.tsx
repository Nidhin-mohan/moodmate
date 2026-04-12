import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getAllMoodLogs } from "@/services/moodLogService";
import type { MoodLog } from "@/services/moodLogService";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Smile,
  Moon,
  Dumbbell,
  Brain,
  Tag,
  Users,
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

export default function MoodHistory() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await getAllMoodLogs({ page, limit });
        setLogs(res.data);
        setTotalPages(res.pages);
      } catch (error) {
        console.error("Failed to fetch mood logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [page]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mood History</h1>
          <p className="text-muted-foreground text-sm mt-1">All your mood check-ins in one place.</p>
        </div>
        <Link to="/mood-tracking">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus size={16} />
            New Entry
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-card p-8 rounded-xl shadow-sm border border-border text-center">
          <Smile size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground text-sm mb-4">No mood logs yet.</p>
          <Link to="/mood-tracking">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Plus size={16} />
              Log Your First Mood
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log._id}
                className="bg-card p-5 rounded-xl shadow-sm border border-border hover:border-primary/30 transition-colors"
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${MOOD_COLORS[log.mood] ?? "bg-muted-foreground"}`} />
                    <h3 className="font-semibold text-foreground text-sm">{log.mood}</h3>
                    {log.specificEmotion && (
                      <span className="text-sm text-muted-foreground">· {log.specificEmotion}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md shrink-0 ml-3">
                    {formatDate(log.date ?? log.createdAt)}
                  </span>
                </div>

                {/* Metrics row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                  <span>
                    Intensity: <strong className="text-foreground">{log.intensity}/10</strong>
                  </span>
                  <span>
                    Energy: <strong className="text-foreground">{log.energyLevel}/10</strong>
                  </span>
                  {log.stressLevel != null && (
                    <span className="flex items-center gap-1">
                      <Brain size={12} className="text-orange-500" />
                      Stress: <strong className="text-foreground ml-0.5">{log.stressLevel}/10</strong>
                    </span>
                  )}
                  {log.anxietyLevel != null && (
                    <span className="flex items-center gap-1">
                      <Brain size={12} className="text-purple-500" />
                      Anxiety: <strong className="text-foreground ml-0.5">{log.anxietyLevel}/10</strong>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Moon size={12} />
                    {log.sleepHours}h sleep (quality {log.sleepQuality}/5)
                  </span>
                  {log.exercise && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Dumbbell size={12} />
                      {log.exerciseMinutes != null ? `${log.exerciseMinutes} min` : "Exercised"}
                    </span>
                  )}
                </div>

                {/* Context badges */}
                {(log.socialQuality || log.moodTriggerCategory) && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {log.socialQuality && (
                      <span className="flex items-center gap-1 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                        <Users size={11} />
                        {log.socialQuality.charAt(0).toUpperCase() + log.socialQuality.slice(1)}
                      </span>
                    )}
                    {log.moodTriggerCategory && (
                      <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        <Tag size={11} />
                        {log.moodTriggerCategory.charAt(0).toUpperCase() + log.moodTriggerCategory.slice(1)}
                      </span>
                    )}
                  </div>
                )}

                {/* People / Places / Events tags — kept semantic colors */}
                {(log.tagsPeople?.length || log.tagsPlaces?.length || log.tagsEvents?.length) ? (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {log.tagsPeople?.map((t) => (
                      <span key={t} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                    {log.tagsPlaces?.map((t) => (
                      <span key={t} className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                    {log.tagsEvents?.map((t) => (
                      <span key={t} className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                ) : null}

                {/* Notes */}
                {log.notes && (
                  <p className="text-sm text-foreground/80 mt-2">{log.notes}</p>
                )}
                {log.reflections && (
                  <p className="text-xs text-muted-foreground italic mt-1">{log.reflections}</p>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="gap-1"
              >
                <ChevronLeft size={16} />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1"
              >
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
