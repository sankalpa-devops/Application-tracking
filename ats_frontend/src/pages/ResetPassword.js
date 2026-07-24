import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";


function ResetPassword() {

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLinkError = message.toLowerCase().includes("invalid") ||
    message.toLowerCase().includes("expired") ||
    message.toLowerCase().includes("missing");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!token) {
      setMessage("Reset link is missing or invalid");
      return;
    }

    if (password !== confirm) {
      setMessage("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {

      const res = await axios.post(
        `${API}/auth/reset-password`,

        {
          token: token,
          new_password: password
        },

        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      setMessage(res.data.message);

      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (err) {

      console.log("RESET ERROR:", err.response);

      setMessage(
        err.response?.data?.detail || "Reset failed"
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-4 col-md-6">

            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-4">

                <div className="text-center mb-4">
                  <h3 className="fw-bold text-primary">ATS Portal</h3>
                  <p className="text-muted mb-0">Create a new password</p>
                </div>

                {message && (
                  <div
                    className={`alert text-center py-2 ${message.includes("Successful") ? "alert-success" : "alert-info"
                      }`}
                  >
                    {message}
                  </div>
                )}

                {isLinkError && (
                  <div className="text-center mb-3">
                    <a href="/forgot" className="text-decoration-none small fw-semibold">
                      Request new reset link
                    </a>
                  </div>
                )}

                <form onSubmit={handleSubmit}>

                  <div className="form-floating mb-3">
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      placeholder="New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <label htmlFor="newPassword">New Password</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      placeholder="Confirm Password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                    <label htmlFor="confirmPassword">Confirm Password</label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={isSubmitting || !token}
                  >
                    {isSubmitting ? "Resetting..." : "Reset Password"}
                  </button>

                  <div className="text-center mt-3">
                    <a href="/" className="text-decoration-none small">
                      Back to Login
                    </a>
                  </div>

                </form>
              </div>
            </div>

            <div className="text-center mt-3 text-muted small">
              © 2026 ATS System
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
