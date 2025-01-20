import React, { useState } from "react";
// import { Button, Input } from "../../components/ui";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = () => {
    // Dummy token logic
    login("dummy-token");
    navigate("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-slate-900">
      <h1 className="text-2xl font-bold mb-6">Login</h1>
      <Input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4"
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4"
      />
      <Button onClick={handleLogin} className="w-full">
        Login
      </Button>
    </div>
  );
};

export default Login;
