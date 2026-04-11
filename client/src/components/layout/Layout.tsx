import React from "react";
import Navbar from "@/components/layout/Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <Navbar />
      <main className="flex-1 p-4 bg-white/80 dark:bg-slate-900/80 rounded-lg shadow-lg backdrop-blur-lg">
        {children}
      </main>
    </div>
  );
};

export default Layout;
