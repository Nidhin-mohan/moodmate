import { Button, Card } from "../components/ui";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">

        {/* Left Column: Text & Actions */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 order-2 lg:order-1">

          {/* Pill label */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium">
            <Sparkles size={16} />
            <span>Your Mental Wellness Partner</span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              Find clarity and balance with{" "}
              <span className="text-primary">MoodMate</span>.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl">
              Connect with yourself, track your journey, and take actionable
              steps toward better mental health every single day.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-full py-6 px-8 text-lg shadow-md">
                Sign Up Free
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                className="w-full sm:w-auto text-foreground hover:text-primary hover:bg-accent rounded-full py-6 px-8 text-lg"
              >
                Log In
              </Button>
            </Link>
          </div>

          {/* Secondary Link */}
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline mt-4 group"
          >
            Explore features without an account{" "}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Right Column: Abstract UI Preview */}
        <div className="relative order-1 lg:order-2 hidden md:block h-full min-h-[400px]">
          {/* Decorative blobs */}
          <div className="absolute top-10 right-10 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />

          {/* Mock UI card */}
          <Card className="absolute inset-0 m-auto w-[90%] h-fit p-8 shadow-2xl border-border bg-card/90 backdrop-blur-xl rounded-3xl rotate-2 hover:rotate-0 transition-transform duration-500 ease-out">
            <div className="space-y-6">
              <div className="h-8 w-1/3 bg-muted rounded-lg animate-pulse" />
              <div className="space-y-3">
                <div className="h-24 w-full bg-accent/40 rounded-xl p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-4 w-1/2 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-24 w-full bg-card border border-border rounded-xl p-4 flex items-center gap-4 opacity-60">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-2/3 bg-muted rounded" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Home;
