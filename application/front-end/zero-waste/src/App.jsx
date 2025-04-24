import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login/LoginPage";
import SignupPage from "./pages/Login/SignupPage";
import ProtectedRoute from "./pages/Login/ProtectedRoute";
import MainPage from './pages/MainPage/MainPage';
import AdminPanel from  "./Admin/AdminPanel";
import ChallengePanel from  "./Admin/ChallengePanel";
import CommentPanel from  "./Admin/CommentPanel";
import UserPanel from  "./Admin/UserPanel";

export default function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<MainPage />} />
        <Route path="/adminPage" element={<AdminPanel />} />
        <Route path="/challengePage" element={<ChallengePanel />} />
        <Route path="/commentPage" element={<CommentPanel />} />
        <Route path="/userPage" element={<UserPanel />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<LoginPage />} />
      
    </Routes>
  );
}
