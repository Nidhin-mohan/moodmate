import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card"; // Assuming you have a Card component, or use div with classes
import { 
  Plus, 
  TrendingUp, 
  Calendar, 
  Smile, 
  Activity 
} from "lucide-react";

const Dashboard = () => {
  // Mock Data - In a real app, this comes from your API/Context
  const userStats = {
    streak: 5,
    totalEntries: 42,
    averageMood: "Happy"
  };

  const recentMoods = [
    { id: 1, date: "Today, 9:00 AM", mood: "Happy", note: "Had a great coffee!" },
    { id: 2, date: "Yesterday, 8:30 PM", mood: "Calm", note: "Read a book." },
    { id: 3, date: "Dec 19, 2:00 PM", mood: "Stressed", note: "Work deadline." },
  ];

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Welcome Back!</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <Calendar size={16} className="text-teal-600" />
              {currentDate}
            </p>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shadow-lg shadow-teal-200/50 transition-transform active:scale-95">
            <Plus size={20} />
            Log Mood
          </Button>
        </div>

        {/* 2. Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Streak Card */}
          <Card className="p-6 border-none shadow-md bg-white rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Current Streak</p>
              <h3 className="text-2xl font-bold text-slate-800">{userStats.streak} Days</h3>
            </div>
          </Card>

          {/* Average Mood Card */}
          <Card className="p-6 border-none shadow-md bg-white rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
              <Smile size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Average Mood</p>
              <h3 className="text-2xl font-bold text-slate-800">{userStats.averageMood}</h3>
            </div>
          </Card>

          {/* Total Entries Card */}
          <Card className="p-6 border-none shadow-md bg-white rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Check-ins</p>
              <h3 className="text-2xl font-bold text-slate-800">{userStats.totalEntries}</h3>
            </div>
          </Card>
        </div>

        {/* 3. Main Content: Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent History List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
              <button className="text-teal-600 text-sm font-medium hover:underline">View All</button>
            </div>
            
            <div className="space-y-4">
              {recentMoods.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-teal-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Mood Indicator Dot */}
                    <div className={`w-3 h-3 rounded-full ${
                      item.mood === "Happy" ? "bg-green-500" : 
                      item.mood === "Stressed" ? "bg-red-500" : "bg-blue-500"
                    }`} />
                    
                    <div>
                      <h4 className="font-semibold text-slate-800">{item.mood}</h4>
                      <p className="text-sm text-slate-500">{item.note}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Side Widget (Motivation or Tips) */}
          <div className="lg:col-span-1">
             <h2 className="text-xl font-bold text-slate-800 mb-4">Daily Insight</h2>
             <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                  <p className="font-medium text-indigo-100 text-sm mb-2">Quote of the day</p>
                  <blockquote className="text-lg font-serif italic mb-4">
                    "Happiness is not something ready made. It comes from your own actions."
                  </blockquote>
                  <p className="text-right text-sm text-indigo-200">- Dalai Lama</p>
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;