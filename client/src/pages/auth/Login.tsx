import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });
      const { token, ...userData } = response.data.data;
      login(userData, token);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">

      <div className="w-full max-w-md bg-card backdrop-blur-xl shadow-xl rounded-2xl p-8 sm:p-10 border border-border">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm">
            Continue your journey with{" "}
            <span className="text-primary font-medium">MoodMate</span>.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground ml-1">
              Email Address
            </label>
            <Input
              placeholder="hello@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-background border-border focus-visible:ring-ring text-base"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground ml-1">
              Password
            </label>
            <Input
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl bg-background border-border focus-visible:ring-ring text-base"
            />
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-md mt-2"
          >
            Log In
          </Button>
        </form>

        {/* Forgot Password */}
        <div className="mt-6 text-center">
          <Link
            to="/forgot-password"
            className="text-muted-foreground hover:text-primary hover:underline text-sm transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-muted-foreground text-sm mt-8 pt-6 border-t border-border">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary font-semibold hover:underline transition-colors"
          >
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
