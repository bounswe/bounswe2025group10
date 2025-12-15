import "../../App.css";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { settingsService } from "../../services/settingsService";
import { showToast } from "../../utils/toast.js";

export default function RecoveryPage() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // 'success' | 'deleted' | null

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      // Calls the public endpoint to cancel deletion
      const res = await settingsService.cancelDeletionByToken(token);

      if (res.status === 'canceled') {
        setResult('success');
        showToast("Account restored successfully!", "success", 2000);
      } else if (res.status === 'deleted') {
        setResult('deleted');
      }
    } catch (err) {
      console.error(err);
      showToast("Invalid token or network error.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-success bg-opacity-10">
      <div className="card border-success shadow-lg rounded-4 p-5 col-12 col-md-6 col-lg-4 mx-auto">
        
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="h3 fw-bold text-success mb-1">Recover Account</h1>
          <p className="text-muted mb-0">
             Restore your zero-waste journey ♻️
          </p>
        </div>

        {/* 1. Success State */}
        {result === 'success' ? (
          <div className="text-center">
            <div className="display-1 mb-3">🎉</div>
            <h4 className="text-success fw-bold mb-3">Account Reactivated!</h4>
            <p className="text-muted mb-4 small">
              Your account has been fully restored. You can now log in normally.
            </p>
            <button 
              onClick={() => navigate('/login')} 
              className="btn btn-success w-100 shadow-sm fw-bold"
            >
              Go to Login
            </button>
          </div>
        ) : result === 'deleted' ? (
          /* 2. Deleted State */
          <div className="text-center">
            <div className="display-1 mb-3">💀</div>
            <h4 className="text-danger fw-bold mb-3">Account Permanently Deleted</h4>
            <p className="text-muted mb-4 small">
              The 30-day grace period has expired. This account cannot be recovered.
            </p>
            <Link to="/signup" className="btn btn-outline-secondary w-100 shadow-sm">
              Create New Account
            </Link>
          </div>
        ) : (
          /* 3. Input Form State */
          <form onSubmit={handleSubmit}>
            <p className="text-center text-muted mb-4 small">
              Enter the recovery token you saved when you requested deletion to stop the process and reactivate your account.
            </p>

            <div className="mb-4">
              <label htmlFor="recovery-token" className="form-label text-success">
                Recovery Token
              </label>
              <input
                id="recovery-token"
                type="text"
                className="form-control border-success"
                placeholder="Paste token here..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-success w-100 shadow-sm mb-3"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Recover Account"}
            </button>

            <div className="text-center mt-3">
              <Link to="/login" className="link-secondary small text-decoration-none">
                Cancel and return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}