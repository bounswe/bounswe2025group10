import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";
import React from "react";

export default function ProtectedAdminRoute() {
  const { isAdmin, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
