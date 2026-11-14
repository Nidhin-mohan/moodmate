import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/layout/AuthShell";
import { authInputClass, authLabelClass } from "@/components/layout/authStyles";
import { signup } from "@/services/authServices";
import { showToast } from "@/utils/toast";

const SignUp = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in your name, email and a password.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await signup(formData);
      if (response.success) {
        showToast.success("Welcome to MoodMate! Please log in.");
        navigate("/login");
      } else {
        setError(response.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      // authServices turns API errors into a user-facing message (e.g. email already in use).
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Start your journal"
      subtitle="A quiet place to notice how you feel. It takes a few seconds a day."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignUp} className="space-y-5" noValidate>
        <div>
          <label htmlFor="signup-name" className={authLabelClass}>
            Your name
          </label>
          <Input id="signup-name" name="name" autoComplete="name" placeholder="Asha" value={formData.name} onChange={handleChange} disabled={isLoading} className={authInputClass} />
        </div>
        <div>
          <label htmlFor="signup-email" className={authLabelClass}>
            Email
          </label>
          <Input id="signup-email" name="email" type="email" autoComplete="email" placeholder="hello@example.com" value={formData.email} onChange={handleChange} disabled={isLoading} className={authInputClass} />
        </div>
        <div>
          <label htmlFor="signup-password" className={authLabelClass}>
            Password
          </label>
          <Input id="signup-password" name="password" type="password" autoComplete="new-password" placeholder="••••••••" value={formData.password} onChange={handleChange} disabled={isLoading} className={authInputClass} />
        </div>

        {error && (
          <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isLoading} className="mt-2 h-12 w-full rounded-full text-base">
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Creating your account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthShell>
  );
};

export default SignUp;
