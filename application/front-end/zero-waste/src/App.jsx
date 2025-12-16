import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ProtectedUserRoute from "./routes/ProtectedUserRoute";
import PublicRoute from "./routes/PublicRoute";
import UserLayout from "./components/layout/UserLayout";
import MainPage from "./pages/MainPage";
import LandingPage from "./pages/LandingPage";
import AdminPanel from "./pages/admin/AdminPanel";
import ChallengePanel from "./pages/admin/ChallengePanel";
import CommentPanel from "./pages/admin/CommentPanel";
import UserPanel from "./pages/admin/UserPanel";
import ActivityPanel from "./pages/admin/ActivityPanel";
import AdminLayout from './components/layout/AdminLayout';
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute"
import Challenges from "./pages/Challenges.jsx";
import Profile from "./pages/profile/ProfilePage.jsx"
import Community from "./pages/Community.jsx";
import Tips from "./pages/Tips.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Achievements from "./pages/Achievements.jsx";
import PublicProfile from "./pages/profile/PublicProfile.jsx";
import RecyclingCenters from "./pages/RecyclingCenters.jsx";
import Invite from "./pages/Invite.jsx";
import Statistics from "./pages/Statistics.jsx";
import Settings from "./pages/Settings.jsx";
import RecoveryPage from "./pages/auth/RecoveryPage.jsx";
import PreferencesPage from "./pages/settings/PreferencesPage.jsx";



export default function App() {
  return (


    <Routes>
      {/* Public Routes (Redirect to MainPage/Admin if logged in) */}
      <Route element={<PublicRoute />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
              <Route path="/recover" element={<RecoveryPage />} />

      </Route>

      {/* Protected User Routes */}
      <Route element={<ProtectedUserRoute />}>
        <Route element={<UserLayout />}>
          <Route path="/mainPage" element={<MainPage />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/community" element={<Community />} />
          <Route path="/recycling-centers" element={<RecyclingCenters />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/invite" element={<Invite />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:username" element={<PublicProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/preferences" element={<PreferencesPage />} />

        </Route>
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<ProtectedAdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/adminPage" element={<AdminPanel />} />
          <Route path="/userPage" element={<UserPanel />} />
          <Route path="/challengePage" element={<ChallengePanel />} />
          <Route path="/commentPage" element={<CommentPanel />} />
          <Route path="/activityPage" element={<ActivityPanel />} />
          <Route path="/admin/profile" element={<Profile />} />
          <Route path="/admin/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Catch all - redirect to Landing (PublicRoute will handle logged-in redirect) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

}
