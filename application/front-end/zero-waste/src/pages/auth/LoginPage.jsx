/* src/pages/LoginPage.jsx
   — cleaned-up version —
*/
import "../App.css";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/AuthContext";
import { showToast } from "../../utils/toast.js";

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate     = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  // ───────────────────────── handleSubmit ─────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Wait for the login() promise to resolve
    const { success, isAdmin, message } = await login(email, password);

    if (success) {
      showToast("Login successful! Redirecting…", "success", 2000);

      // Give the toast a moment, then redirect
      const target = isAdmin ? "/adminPage" : "/";
      setTimeout(() => navigate(target), 1500);
    } else {
      showToast(`Login failed: ${message ?? "unknown error"}`, "error", 3000);
    }
  };
  // ────────────────────────────────────────────────────────────────

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-success bg-opacity-10">
      <div className="card border-success shadow-lg rounded-4 p-5 col-12 col-md-6 col-lg-4 mx-auto">
        {/* Heading */}
        <div className="text-center mb-4">
          <h1 className="h3 fw-bold text-success mb-1">Sign In</h1>
          <p className="text-muted mb-0">
            Welcome back to the Zero-Waste Community 🌿
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label text-success">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-control border-success"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label text-success">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-control border-success"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-success w-100 shadow-sm mb-3">
            Login
          </button>
        </form>

        {/* Sign-up link */}
        <div className="text-center mt-3">
          <p className="small text-muted">
            Don’t have an account?{" "}
            <Link to="/signup" className="link-success fw-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}