import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContent";
import React from "react";

export default function ProtectedUserRoute() {
  const token = localStorage.getItem("accessToken");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}