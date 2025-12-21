import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "@/services/authServices";
import { showToast } from "@/utils/toast";
import { Loader2 } from "lucide-react"; // Assuming you have lucide-react, or use any spinner icon

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents page reload
    
    // Basic Client-side validation
    if (!formData.name || !formData.email || !formData.password) {
        showToast.error("Please fill in all fields.");
        return;
    }

    setIsLoading(true);

    try {
      const response = await signup(formData);

      if (response.success) {
        showToast.success("Welcome to MoodMate! Please log in.");
        navigate("/login");
      } else {
        showToast.error(response.message || "Registration failed. Try again.");
      }
    } catch (err) {
      showToast.error("Something went wrong. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 1. Theme Consistency: Using the same Gradient background as Home
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-blue-100 p-6">
      
      {/* Glassmorphism Card Effect */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-2xl shadow-teal-900/5 rounded-3xl p-8 sm:p-10 border border-white/50">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Join <span className="text-teal-600">MoodMate</span>
          </h1>
          <p className="text-slate-500">
            Start your journey towards better mental wellbeing today.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">
              Full Name
            </label>
            <Input
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className="h-12 rounded-xl bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">
              Email Address
            </label>
            <Input
              name="email"
              placeholder="hello@example.com"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className="h-12 rounded-xl bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">
              Password
            </label>
            <Input
              name="password"
              placeholder="••••••••"
              type="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="h-12 rounded-xl bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all"
            />
          </div>

          {/* Submit Button with Loading State */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-lg shadow-lg shadow-teal-200/50 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Creating Account...</span>
              </div>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        {/* Footer / Login Link */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-colors"
          >
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;