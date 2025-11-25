import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ProtectedUserRoute from "./routes/ProtectedUserRoute";
import MainPage from "./pages/MainPage";
import AdminPanel from "./pages/admin/AdminPanel";
import ChallengePanel from "./pages/admin/ChallengePanel";
import CommentPanel from "./pages/admin/CommentPanel";
import UserPanel from "./pages/admin/UserPanel";
import ActivityPanel from "./pages/admin/ActivityPanel";
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


export default function App() {
  return (

    
    <Routes>
      <Route element={<ProtectedUserRoute />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/tips" element={<Tips />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/community" element={<Community />} />
        <Route path="/recycling-centers" element={<RecyclingCenters />} />
        <Route path="/invite" element={<Invite />} />

        <Route path="/profile" element={<Profile /> }></Route>
        <Route path="/profile/:username" element={<PublicProfile />} />
        <Route path="*" element={<MainPage />} /> {/* Redirect to MainPage for any other routes */}

      </Route>

      
      <Route element={<ProtectedAdminRoute />}>
        <Route path="/adminPage" element={<AdminPanel />} />
        <Route path="/userPage" element={<UserPanel></UserPanel>} />
        <Route path="/challengePage" element={<ChallengePanel />} />
        <Route path="/commentPage" element={<CommentPanel />} />
        <Route path="/activityPage" element={<ActivityPanel />} />
      </Route>
      
      
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
  
}
