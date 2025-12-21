import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom"; // Added Link for better UI navigation
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents page reload when hitting Enter
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });
      // 1. Destructure the response
    const { token, ...userData } = response.data.data;

    // 2. Call login with separated data
    login(userData, token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      // Optional: Add toast error here if you want
    }
  };

  return (
    // 1. Background: Soft Teal/Blue Gradient
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-sky-50 to-blue-100 p-6">
      
      {/* 2. Card: Glassmorphism effect with soft shadows */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-2xl shadow-teal-900/5 rounded-3xl p-8 sm:p-10 border border-white/50">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-500">
            Continue your journey with <span className="text-teal-600 font-medium">MoodMate</span>.
          </p>
        </div>

        {/* Form Wrapper - Allows "Enter" key submission */}
        <form onSubmit={handleLogin} className="space-y-5">
          
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">
              Email Address
            </label>
            <Input
              placeholder="hello@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all text-base"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1">
              Password
            </label>
            <Input
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all text-base"
            />
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-lg shadow-lg shadow-teal-200/50 transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
          >
            Log In
          </Button>
        </form>

        {/* Forgot Password */}
        <div className="mt-6 text-center">
          <Link 
            to="/forgot-password" 
            className="text-slate-500 hover:text-teal-600 hover:underline text-sm transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-slate-500 text-sm mt-8 pt-6 border-t border-slate-200">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-teal-600 font-semibold hover:text-teal-700 hover:underline transition-colors"
          >
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;