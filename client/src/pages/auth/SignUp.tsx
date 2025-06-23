import  { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { signup } from "@/services/authServices";
import { showToast } from "@/utils/toast";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

   const handleSignUp = async () => {
     try {

      const response = await signup({ name, email, password });

      // //  Handle successful signup
       if (response.success) {
       showToast.success("user Registered succsessfully !");

         navigate("/login"); // Redirect to the login page
       } else {
       showToast.error("user Registration failed !");

         console.log("error")
         // setError(response.message);
       }
     } catch (err) {
       showToast.error("user Registration failed !");

      console.log("errror")
       // Handle errors
      //  if (axios.isAxiosError(err)) {
      //   //  setError(err.response?.data?.message || "Signup failed");
      //  } else {
      //   //  setError("An unexpected error occurred");
      //  }
     }
   };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-800 via-indigo-700 to-purple-900 text-gray-200 p-6">
      <div className="max-w-md w-full bg-white/10 p-8 rounded-xl shadow-lg backdrop-blur-lg">
        <h1 className="text-4xl font-serif text-indigo-400 text-center mb-6">
          Create Your Account
        </h1>
        <p className="text-center text-lg text-gray-300 mb-6">
          Join us and take the first step towards better mental health.
        </p>

        {/* Input Fields */}
        <div className="mb-4">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-white/20 text-gray-200 placeholder-gray-300 rounded-lg p-4"
          />
        </div>
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

        {/* Sign Up Button */}
        <Button
          onClick={handleSignUp}
          className="w-full bg-indigo-600 text-white py-2 px-6 rounded-full hover:bg-indigo-800 focus:ring focus:ring-indigo-200"
        >
          Sign Up
        </Button>

        {/* Already have an account? */}
        <div className="mt-6 text-center">
          <p className="text-gray-300">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-indigo-400 hover:underline text-lg transition duration-300 ease-in-out"
            >
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
