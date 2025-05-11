import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./Login/LoginPage";
import SignupPage from "./Login/SignupPage";
import ProtectedUserRoute from "./Login/ProtectedUserRoute";
import MainPage from "./MainPage/MainPage";
import AdminPanel from "./Admin/AdminPanel";
import ChallengePanel from "./Admin/ChallengePanel";
import CommentPanel from "./Admin/CommentPanel";
import UserPanel from "./Admin/UserPanel";
import ProtectedAdminRoute from "./Login/ProtectedAdminRoute"
import Challenges from "./pages/Challenges.jsx";
export default function App() {
  return (
    <Routes>
      <Route element={<ProtectedUserRoute />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/challenges" element={<Challenges />} />
        {/*<Route path="/community" element={<Community />} />*/}
        {/*<Route path="/profile" element={<Profile />} />*/}
        <Route path="*" element={<MainPage />} /> {/* Redirect to MainPage for any other routes */}
      </Route>

      
      <Route element={<ProtectedAdminRoute />}>
        <Route path="/adminPage" element={<AdminPanel />} />
        <Route path="/userPage" element={<UserPanel></UserPanel>} />
        <Route path="/challengePage" element={<ChallengePanel />} />
        <Route path="/commentPage" element={<CommentPanel />} />
      </Route>
      
      
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}
