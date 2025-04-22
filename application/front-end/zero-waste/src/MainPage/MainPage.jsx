import { useAuth } from "../Login/AuthContent";

export default function MainPage() {
  const { user, logout } = useAuth();

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow border-0 p-5 text-center w-100" style={{ maxWidth: "600px" }}>
        <h1 className="display-6 mb-4">Welcome, {user?.email}!</h1>
        <p className="lead mb-4">🎉 You’re logged in. This is the protected MainPage.</p>
        <button className="btn btn-outline-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}