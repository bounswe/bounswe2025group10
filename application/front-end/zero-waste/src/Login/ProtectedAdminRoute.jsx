import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContent";
import React from "react";

export default function ProtectedAdminRoute() {
  const { isAdmin, isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
  }
  return <Navigate to="/login" replace />;
}