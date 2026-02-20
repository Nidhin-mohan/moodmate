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
} from "lucide-react";

const MOOD_COLORS: Record<string, string> = {
  Happy: "bg-green-500",
  Excited: "bg-yellow-500",
  Neutral: "bg-slate-400",
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
          <h1 className="text-3xl font-bold text-slate-800">Mood History</h1>
          <p className="text-slate-500 mt-1">All your mood check-ins in one place.</p>
        </div>
        <Link to="/mood-tracking">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Plus size={16} />
            New Entry
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-teal-600" size={32} />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center">
          <Smile size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 mb-4">No mood logs yet.</p>
          <Link to="/mood-tracking">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
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
                className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:border-teal-200 transition-colors"
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${MOOD_COLORS[log.mood] ?? "bg-slate-400"}`} />
                    <h3 className="font-semibold text-slate-800">{log.mood}</h3>
                    {log.specificEmotion && (
                      <span className="text-sm text-slate-400">· {log.specificEmotion}</span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    {formatDate(log.date ?? log.createdAt)}
                  </span>
                </div>

                {/* Metrics row */}
                <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-2">
                  <span>Intensity: <strong className="text-slate-700">{log.intensity}/10</strong></span>
                  <span>Energy: <strong className="text-slate-700">{log.energyLevel}/10</strong></span>
                  <span className="flex items-center gap-1">
                    <Moon size={14} /> {log.sleepHours}h sleep (quality {log.sleepQuality}/5)
                  </span>
                  {log.exercise && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Dumbbell size={14} /> Exercised
                    </span>
                  )}
                </div>

                {/* Tags */}
                {(log.tagsPeople?.length || log.tagsPlaces?.length || log.tagsEvents?.length) ? (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {log.tagsPeople?.map((t) => (
                      <span key={t} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                    {log.tagsPlaces?.map((t) => (
                      <span key={t} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                    {log.tagsEvents?.map((t) => (
                      <span key={t} className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                ) : null}

                {/* Notes */}
                {log.notes && (
                  <p className="text-sm text-slate-600 mt-2">{log.notes}</p>
                )}
                {log.reflections && (
                  <p className="text-sm text-slate-500 italic mt-1">{log.reflections}</p>
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
              <span className="text-sm text-slate-500">
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
