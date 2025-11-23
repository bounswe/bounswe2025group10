import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";
import React from "react";

export default function ProtectedUserRoute() {
  const { isAuthenticated } = useAuth();
  // TEMPORARY: Bypass authentication for local development
  return <Outlet />;
  // return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
