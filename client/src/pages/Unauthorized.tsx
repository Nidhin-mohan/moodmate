import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { MoodFace } from "@/components/mood/MoodFace";

export default function Unauthorized() {
  const { isLoggedIn } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-4">
      <div className="max-w-md rounded-[28px] border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto w-fit">
          <MoodFace mood="Neutral" size={64} decorative />
        </div>
        <h1 className="mt-5 font-serif text-[26px] font-medium text-foreground">This page isn't available to you</h1>
        <p className="mt-2 text-muted-foreground">
          Your account doesn't have access here. Nothing is wrong with your journal; it's just a different area of the app.
        </p>
        <Link
          to={isLoggedIn ? "/dashboard" : "/login"}
          className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90"
        >
          {isLoggedIn ? "Back to your dashboard" : "Log in"}
        </Link>
      </div>
    </div>
  );
}
