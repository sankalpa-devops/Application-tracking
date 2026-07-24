// import axios from "axios";
// import { useState } from "react";

// function ForgotPassword() {

//   const [empId, setEmpId] = useState("");
//   const [email, setEmail] = useState("");
//   const [message, setMessage] = useState("");

//   const handleSubmit = async (e) => {

//     e.preventDefault();

//     if (!empId || !email) {
//       setMessage("All fields are required");
//       return;
//     }

//     try {

//       await axios.post(`${process.env.REACT_APP_API_BASE_URL}/auth/forgot-password`, {
//         emp_id: empId,
//         email: email
//       });

//       setMessage("Reset link sent to your email");

//     } catch (err) {

//       setMessage("Invalid Employee ID or Email");

//     }
//   };

//   return (

//     <div style={{ width: "350px", margin: "100px auto" }}>

//       <h2>Forgot Password</h2>

//       {message && <p>{message}</p>}

//       <form onSubmit={handleSubmit}>

//         <input
//           type="text"
//           placeholder="Employee ID"
//           value={empId}
//           onChange={(e) => setEmpId(e.target.value)}
//           style={{ width: "100%", marginBottom: "10px" }}
//         />

//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           style={{ width: "100%", marginBottom: "10px" }}
//         />

//         <button style={{ width: "100%" }}>
//           Send Reset Link
//         </button>

//       </form>

//     </div>
//   );
// }

// export default ForgotPassword;

import axios from "axios";
import { useState } from "react";


const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";


function ForgotPassword() {

  const [empId, setEmpId] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!empId || !email) {
      setMessage("All fields are required");
      return;
    }

    try {
      await axios.post(`${API}/auth/forgot-password`, {
        emp_id: empId,
        email: email
      });

      setMessage("Reset link sent to your email");

    } catch (err) {

      setMessage("Invalid Employee ID or Email");

    }
  };

  return (
    <div className="vh-100 d-flex align-items-center justify-content-center bg-light">

      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-4 col-md-6">

            <div className="card shadow-lg border-0 rounded-4">

              <div className="card-body p-4">

                {/* Header */}
                <div className="text-center mb-4">
                  <h3 className="fw-bold text-primary">ATS Portal</h3>
                  <p className="text-muted mb-0">Reset your password</p>
                </div>

                {/* Message */}
                {message && (
                  <div className="alert alert-info text-center py-2">
                    {message}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>

                  <div className="form-floating mb-3">
                    <input
                      type="text"
                      className="form-control"
                      id="empId"
                      placeholder="Employee ID"
                      value={empId}
                      onChange={(e) => setEmpId(e.target.value)}
                      required
                    />
                    <label htmlFor="empId">Employee ID</label>
                  </div>

                  <div className="form-floating mb-3">
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <label htmlFor="email">Email</label>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                  >
                    Send Reset Link
                  </button>

                  <div className="text-center mt-3">
                    <a href="/" className="text-decoration-none small">
                      Back to Login
                    </a>
                  </div>

                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-3 text-muted small">
              © 2026 ATS System
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
