import React from "react";
import Navbar from "@/components/layout/Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100"
    >
      <Navbar />
      <main className="flex-1 p-4 bg-white/80 rounded-lg shadow-lg backdrop-blur-lg">
        {children}
      </main>
    </div>
  );
};
;

export default Layout;
