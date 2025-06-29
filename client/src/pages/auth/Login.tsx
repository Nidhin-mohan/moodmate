import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async() => {
    // Dummy token logic
     const response = await api.post("/auth/login", {
       name,
       email,
       password,
     });
    login(response.data.token);
    navigate("/dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-800 via-indigo-700 to-purple-900 text-gray-200 p-6">
      <div className="max-w-md w-full bg-white/10 p-8 rounded-xl shadow-lg backdrop-blur-lg">
        <h1 className="text-4xl font-serif text-indigo-400 text-center mb-6">
          Welcome Back
        </h1>
        <p className="text-center text-lg text-gray-300 mb-6">
          We're glad you're here. Please log in to continue.
        </p>

        {/* Input Fields */}
        <div className="mb-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/20 text-gray-200 placeholder-gray-300 rounded-lg p-4"
          />
        </div>
        <div className="mb-6">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white/20 text-gray-200 placeholder-gray-300 rounded-lg p-4"
          />
        </div>

        {/* Login Button */}
        <Button
          onClick={handleLogin}
          className="w-full bg-indigo-600 text-white py-2 px-6 rounded-full hover:bg-indigo-800 focus:ring focus:ring-indigo-200"
        >
          Log In
        </Button>

        {/* Forgot Password Link */}
        <div className="mt-6 text-center">
          <a
            href="#"
            className="text-indigo-400 hover:underline text-lg transition duration-300 ease-in-out"
          >
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
