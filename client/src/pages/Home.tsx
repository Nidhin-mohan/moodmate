import { Button, Card } from "../components/ui";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react"; // Adding icons for visual polish (optional, remove if you don't have lucide-react installed)

const Home = () => {
  return (
    // 1. New Background: Soft, calming gradient (Teal to warm blue)
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-sky-50 to-blue-100 flex items-center justify-center p-6">
      
      {/* Main Content Container - Max width for large screens */}
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Column: Text & Actions */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 order-2 lg:order-1">
          
          {/* Optional: A small "pill" label */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 text-sm font-medium">
            <Sparkles size={16} />
            <span>Your Mental Wellness Partner</span>
          </div>

          {/* Consolidated Typography with better hierarchy */}
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight">
              Find clarity and balance with <span className="text-teal-600">MoodMate</span>.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-xl">
              Connect with yourself, track your journey, and take actionable steps toward better mental health every single day.
            </p>
          </div>

          {/* Action Buttons with clear hierarchy */}
          {/* Note: Wrapping Button with Link is generally safer for router accessibility than putting Link inside Button */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white rounded-full py-6 px-8 text-lg shadow-lg shadow-teal-200/50 transition-all hover:scale-105"
              >
                Sign Up Free
              </Button>
            </Link>
            
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                className="w-full sm:w-auto text-slate-700 hover:text-teal-700 hover:bg-teal-50 rounded-full py-6 px-8 text-lg"
              >
                Log In
              </Button>
            </Link>
          </div>

           {/* Secondary Link */}
           <Link
            to="/o"
            className="inline-flex items-center gap-2 text-teal-600 font-medium hover:underline mt-4 group"
          >
            Explore features without an account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
          </Link>
        </div>


        {/* Right Column: Visual Anchor / Abstract UI Preview */}
        {/* We use the Card component here to create a "stacked" UI look representing the app */}
        <div className="relative order-1 lg:order-2 hidden md:block h-full min-h-[400px]">
             {/* Decorative blobs behind the card */}
            <div className="absolute top-10 right-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>

            {/* The Main Visual Card */}
            <Card className="absolute inset-0 m-auto w-[90%] h-fit p-8 shadow-2xl shadow-teal-900/10 border-slate-100/50 bg-white/80 backdrop-blur-xl rounded-3xl rotate-2 hover:rotate-0 transition-transform duration-500 ease-out">
                <div className="space-y-6">
                    <div className="h-8 w-1/3 bg-slate-100 rounded-lg animate-pulse"></div>
                    <div className="space-y-3">
                        <div className="h-24 w-full bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-teal-200"></div>
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-3/4 bg-slate-200/70 rounded"></div>
                                <div className="h-4 w-1/2 bg-slate-200/70 rounded"></div>
                            </div>
                        </div>
                         <div className="h-24 w-full bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 opacity-60">
                            <div className="h-12 w-12 rounded-full bg-blue-100"></div>
                             <div className="space-y-2 flex-1">
                                <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
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