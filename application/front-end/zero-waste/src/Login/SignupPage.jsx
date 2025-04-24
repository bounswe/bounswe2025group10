import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContent";

export default function SignupPage() {
  const { signup } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(email, password);
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-success bg-opacity-10">
      <form
        onSubmit={handleSubmit}
        className="card shadow border-0 p-4 w-100"
        style={{ maxWidth: "400px" }}
      >
        <h1 className="h3 mb-3 text-center fw-bold">Create account</h1>
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
          Sign up
        </button>
        <p className="text-center small">
          Have an account?{" "}
          <Link to="/login" className="link-primary">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
