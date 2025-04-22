import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContent";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit= (e) => {
    e.preventDefault();
    login(email, password);
    navigate("/");
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-success bg-opacity-10">
      <form
        onSubmit={handleSubmit}
        className="card shadow border-0 p-4 w-100"
        style={{ maxWidth: 400 }}
      >
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
          onChange={(e
          ) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-success w-100 mb-3">
          Login
        </button>
        <p className="text-center small">
          Don’t have an account? <Link to="/signup" className="link-primary">Sign up</Link>
        </p>
      </form>
    </div>
  );
};
export default LoginPage;
