import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContent";
import React from "react";

export default function ProtectedUserRoute() {
  const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
