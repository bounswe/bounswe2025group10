import "../App.css";
import { useState, React} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContent";
import { useNavigate } from "react-router-dom";
import { showToast } from "../util/toast.js";


export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();
    const {success, message} = await signup(email, user, password);
    if (success) {
      showToast("Sign up successful! Redirection to login page...", "success", 2000);
      // 3️⃣ Navigate after a short delay (so user sees the message)
      setTimeout(() => navigate("/login"), 1500);
    } else {
      showToast("Sign up has failed. Error: " + message, "error");
      console.log("Sign up failed");
      console.log(success, message);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-success bg-opacity-10">
      <div
          className="card border-success shadow-lg rounded-4 p-5 col-12 col-md-6 col-lg-4 mx-auto"
          style={{ padding: "3rem" }}
      >
        {/* Header with a zero-waste tagline */}
        <div className="text-center mb-4">
          <h1 className="h3 fw-bold text-success mb-1">Create Your Account</h1>
          <p className="text-muted mb-0">Join the Zero Waste Movement 🌱</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label text-success">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="form-control border-success"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="username" className="form-label text-success">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="form-control border-success"
              placeholder="Choose a username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label text-success">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-control border-success"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-success w-100 shadow-sm">
            Sign Up
          </button>
        </form>

        <div className="text-center mt-3" style={{ marginTop: "1rem" }}>
          <p className="small text-muted">
            Already have an account?{" "}
            <Link to="/login" className="link-success fw-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
