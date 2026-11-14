import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/layout/AuthShell";
import { authInputClass, authLabelClass } from "@/components/layout/authStyles";
import { login as loginRequest } from "@/services/authServices";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await loginRequest({ email, password });
      const { token, ...userData } = response.data;
      login(userData, token);
      navigate("/dashboard");
    } catch (err) {
      // authServices already turned the API error into a user-facing message.
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Good to see you. Let's check in."
      footer={
        <>
          New here?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="login-email" className={authLabelClass}>
            Email
          </label>
          <Input
            id="login-email"
            placeholder="hello@example.com"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
          />
        </div>
        <div>
          <label htmlFor="login-password" className={authLabelClass}>
            Password
          </label>
          <Input
            id="login-password"
            placeholder="••••••••"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={submitting} className="mt-2 h-12 w-full rounded-full text-base">
          Log In
        </Button>
      </form>
    </AuthShell>
  );
};

export default Login;
