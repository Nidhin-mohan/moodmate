import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/fraunces";
import "./index.css";
import { ToastProvider } from "./utils/toast";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* Calm motion only, and none at all when the OS asks for reduced motion. */}
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <ToastProvider />
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  </React.StrictMode>
);
