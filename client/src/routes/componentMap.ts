import { lazy } from "react";

export const componentMap  = {
  Home: lazy(() => import("../pages/Home")),
  Login: lazy(() => import("../pages/auth/Login")),
  SignUp: lazy(() => import("../pages/auth/SignUp")),
  Dashboard: lazy(() => import("../pages/dashboard/Dashboard")),
  MoodTrackingForm: lazy(() => import("../pages/moodTracking/MoodTrackingForm")),
  MoodHistory: lazy(() => import("../pages/moodTracking/MoodHistory")),
  UserProfile: lazy(() => import("../pages/profile/UserProfile")),
  MainLayout: lazy(() => import("../components/layout/Layout")),
  Unauthorized: lazy(() => import("../pages/Unauthorized"))
} as any;
