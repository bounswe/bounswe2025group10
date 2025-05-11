import "../App.css";
import { useState, React } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContent";
import { showToast } from "../util/toast.js";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

   const handleSubmit = async (e) => {
    e.preventDefault();

    const login_data = await login(email, password)
    const success=login_data.success
    const isAdmin=login_data.isAdmin

    if (success) {
      showToast("Login successful! Redirecting...", "success", 2000);
      if(isAdmin){
        setTimeout(() => navigate("/adminPage"), 1500); //go to adminPage if the user is admin
      }
      else{
        setTimeout(() => navigate("/"), 1500);
      }
    } else {
        showToast("Login has failed. Error: " + login_data.message, "error");
        console.log("Login failed");
        console.log(login_data);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-success bg-opacity-10">
        <div
            className="card border-success shadow-lg rounded-4 p-5 col-12 col-md-6 col-lg-4 mx-auto"
            style={{ padding: "3rem" }}
        >
        {/* Header with a zero-waste welcome */}
        <div className="text-center mb-4">
          <h1 className="h3 fw-bold text-success mb-1">Sign In</h1>
          <p className="text-muted mb-0">Welcome back to the Zero Waste Community 🌿</p>
        </div>

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

        <div className="text-center mt-3" style={{ marginTop: "1rem" }}>
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