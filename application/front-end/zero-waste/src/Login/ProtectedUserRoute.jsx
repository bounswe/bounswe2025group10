import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContent";
import React from "react";

export default function ProtectedUserRoute() {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
