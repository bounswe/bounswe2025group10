import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";
import React from "react";

export default function PublicRoute() {
    const { isAuthenticated, isAdmin } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={isAdmin ? "/adminPage" : "/mainPage"} replace />;
    }

    return <Outlet />;
}
