import React, { lazy } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentMap: Record<string, React.LazyExoticComponent<React.ComponentType<any>>>  = {
  Home: lazy(() => import("../pages/Home")),
  Login: lazy(() => import("../pages/auth/Login")),
  SignUp: lazy(() => import("../pages/auth/SignUp")),
  Dashboard: lazy(() => import("../pages/dashboard/Dashboard")),
  MoodTrackingForm: lazy(() => import("../pages/moodTracking/MoodTrackingForm")),
  MoodHistory: lazy(() => import("../pages/moodTracking/MoodHistory")),
  UserProfile: lazy(() => import("../pages/profile/UserProfile")),
  MainLayout: lazy(() => import("../components/layout/Layout")),
  Unauthorized: lazy(() => import("../pages/Unauthorized"))
};
