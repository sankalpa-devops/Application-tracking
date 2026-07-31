
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

function Login({ setCurrentUser }) {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!empId || !password) {
      toast.error("All fields required");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/auth/login`,
        {
          emp_id: empId,
          password: password
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("emp_id", res.data.emp_id);
      localStorage.setItem("user_name", res.data.user_name);

      setCurrentUser({
        emp_id: res.data.emp_id,
        user_name: res.data.user_name
      });

      toast.success("Login Successful");

      if (res.data.role === "HR") {
        navigate("/hr");
      } else {
        navigate("/admin");
      }

    } catch (err) {
      console.log("LOGIN ERROR:", err.response);

      toast.error(
        err.response?.data?.detail || "Login Failed"
      );
    }
  };

  return (
    <div className="vh-100 d-flex align-items-center justify-content-center bg-light">
      <ToastContainer />

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-4 col-md-6">

            <div className="card shadow-lg border-0 rounded-4">

              <div className="card-body p-4">

                {/* Header */}
                <div className="text-center mb-4">
                  <h3 className="fw-bold text-primary">ATS Portal</h3>
                  <p className="text-muted mb-0">Login to your account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="empId"
                      placeholder="Employee ID"
                      value={empId}
                      onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                      required
                    />
                    <label htmlFor="empId">Employee ID</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <label htmlFor="password">Password</label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                  >
                    Login
                  </button>

                  <div className="text-center mt-3">
                    <a href="/forgot" className="text-decoration-none small">
                      Forgot Password?
                    </a>
                  </div>

                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-3 text-muted small">
              © 2026 Sankalpa. All rights reserved by NI Engineering.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
