import "../App.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContent";
import Alert from "./Alert";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status,setStatus]=useState(true)

  const [msg, setMsg] = useState('');
  const [type, setType] = useState('success');
  const showAlert = (message, type = 'info') => {
      setMsg(message);
       setType(type);
       setTimeout(() => setMsg(''), 3000);
     };
  
     const handleSubmit = async (e) => {
      e.preventDefault();
    
      // 1️⃣ Wait for login() to finish
      const success = await login(email, password);
    
      if (success) {
        // 2️⃣ Show success alert
        showAlert("Login successful!", "success");
        // 3️⃣ Navigate after a short delay (so user sees the message)
        setTimeout(() => navigate("/"), 1500);
      } else {
        // 4️⃣ Only show the failure alert on error
        showAlert("Login has failed", "warning");
        // no navigation here
      }
    };

  return (
    <>
    {msg && (
        <div
          className="position-fixed top-0 start-50 translate-middle-x mt-3"
          style={{ zIndex: 1050, width: "400px" }}
        >
          <Alert message={msg} type={type} onClose={() => setMsg("")} />
        </div>
      )}
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-success bg-opacity-10">
      <div
        className="card border-success shadow-lg rounded-4 p-5 w-100"
        style={{ maxWidth: "400px" }}
      >
<<<<<<< HEAD
        <h1 className="h3 mb-3 text-center fw-bold">Sign in</h1>
        <input
          type="email"
          className="form-control mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="form-control mb-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-success w-100 mb-3">
          Login
        </button>
        <p className="text-center small">
          Don’t have an account?{" "}
          <Link to="/signup" className="link-primary">
            Sign up
          </Link>
        </p>
      </form>
=======
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

        <div className="text-center">
          <p className="small text-muted">
            Don’t have an account?{" "}
            <Link to="/signup" className="link-success fw-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
>>>>>>> 1adb9a3dce9734b0495282615d49cf7b57d0de97
    </div>
    </>
  );
}