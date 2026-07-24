// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useParams, useLocation } from "react-router-dom";

// const questions = [
//   { key: "name", text: "What is your full name?" },
//   { key: "email", text: "What is your email address?" },
//   { key: "phone", text: "What is your mobile number?" },
//   { key: "experience", text: "Total years of experience?" },
//   { key: "referral", text: "Were you referred by an employee? (yes/no)" }
// ];

// const API = process.env.REACT_APP_API_BASE_URL; // http://localhost:8000/api

// const PublicJobApply = () => {
//   const { slug } = useParams();
//   const location = useLocation();

//   const queryParams = new URLSearchParams(location.search);
//   const jobIdFromUrl = queryParams.get("job_id");

//   const [jobId, setJobId] = useState(null);
//   const [step, setStep] = useState(0);
//   const [input, setInput] = useState("");
//   const [data, setData] = useState({});
//   const [messages, setMessages] = useState([]);

//   // ---------------- VALIDATE LINK ----------------
//   useEffect(() => {
//     const validate = async () => {
//       try {
//         const res = await axios.get(`${API}/apply/${slug}`);

//         // ✅ Preferred: backend validated job_id
//         setJobId(res.data.job_id);
//         setMessages([{ from: "bot", text: questions[0].text }]);

//       } catch (err) {
//         // 🔁 FALLBACK: job_id from URL
//         if (jobIdFromUrl) {
//           setJobId(jobIdFromUrl);
//           setMessages([
//             {
//               from: "bot",
//               text: questions[0].text
//             }
//           ]);
//         } else {
//           // ❌ Truly invalid link
//           setMessages([
//             {
//               from: "bot",
//               text: "This application link is invalid or expired."
//             }
//           ]);
//         }
//       }
//     };

//     validate();
//   }, [slug, jobIdFromUrl]);

//   // ---------------- CHAT HANDLER ----------------
//   const handleSend = () => {
//     if (!jobId) return;

//     const q = questions[step];
//     const value = input.trim();
//     if (!value) return;

//     setMessages((m) => [...m, { from: "user", text: value }]);
//     const updatedData = { ...data, [q.key]: value };
//     setData(updatedData);
//     setInput("");

//     if (step + 1 < questions.length) {
//       setMessages((m) => [
//         ...m,
//         { from: "bot", text: questions[step + 1].text }
//       ]);
//       setStep(step + 1);
//     } else {
//       submitApplication(updatedData);
//     }
//   };

//   // ---------------- SUBMIT ----------------
//   const submitApplication = async (payload) => {
//     try {
//       await axios.post(`${API}/apply/${slug}`, payload);
//       setMessages((m) => [
//         ...m,
//         { from: "bot", text: "Application submitted 🎉" }
//       ]);
//     } catch (err) {
//       setMessages((m) => [
//         ...m,
//         {
//           from: "bot",
//           text: err.response?.data?.detail || "Submission failed"
//         }
//       ]);
//     }
//   };

//   return (
//     <div style={{ padding: 40 }}>
//       <h2>Job Application Chatbot</h2>

//       {/* DEBUG INFO */}
//       <p><b>Job ID from URL:</b> {jobIdFromUrl || "—"}</p>
//       <p><b>Validated Job ID:</b> {jobId || "—"}</p>

//       <div
//         style={{
//           border: "1px solid #ccc",
//           padding: 20,
//           height: 300,
//           overflowY: "auto"
//         }}
//       >
//         {messages.map((m, i) => (
//           <div
//             key={i}
//             style={{ textAlign: m.from === "bot" ? "left" : "right" }}
//           >
//             <b>{m.from}:</b> {m.text}
//           </div>
//         ))}
//       </div>

//       <input
//         value={input}
//         onChange={(e) => setInput(e.target.value)}
//         onKeyDown={(e) => e.key === "Enter" && handleSend()}
//         placeholder="Type here..."
//         disabled={!jobId}
//         style={{ marginTop: 10 }}
//       />
//       <button onClick={handleSend} disabled={!jobId}>
//         Send
//       </button>
//     </div>
//   );
// };

// export default PublicJobApply;








// import React, { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import { useParams, useLocation } from "react-router-dom";

// /* ---------------- QUESTIONS ---------------- */
// const questions = [
//   { key: "name", text: "What is your full name?" },
//   { key: "email", text: "What is your email address?" },
//   { key: "phone", text: "What is your mobile number?" },
//   { key: "experience", text: "Total years of experience?" },
//   { key: "referral", text: "Were you referred by an employee? (yes/no)" }
// ];

// const API = process.env.REACT_APP_API_BASE_URL; // http://localhost:8000/api

// const PublicJobApply = () => {
//   const { slug } = useParams();
//   const location = useLocation();
//   const chatEndRef = useRef(null);

//   const queryParams = new URLSearchParams(location.search);
//   const jobIdFromUrl = queryParams.get("job_id");

//   const [jobId, setJobId] = useState(null);
//   const [step, setStep] = useState(0);
//   const [input, setInput] = useState("");
//   const [data, setData] = useState({});
//   const [messages, setMessages] = useState([]);

//   /* ---------------- AUTO SCROLL ---------------- */
//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   /* ---------------- VALIDATE LINK ---------------- */
//   useEffect(() => {
//     const validate = async () => {
//       try {
//         const res = await axios.get(`${API}/apply/${slug}`);
//         setJobId(res.data.job_id);
//         setMessages([{ from: "bot", text: questions[0].text }]);
//       } catch (err) {
//         if (jobIdFromUrl) {
//           setJobId(jobIdFromUrl);
//           setMessages([{ from: "bot", text: questions[0].text }]);
//         } else {
//           setMessages([
//             { from: "bot", text: "This application link is invalid or expired." }
//           ]);
//         }
//       }
//     };

//     validate();
//   }, [slug, jobIdFromUrl]);

//   /* ---------------- CHAT HANDLER ---------------- */
//   const handleSend = () => {
//     if (!jobId) return;
//     const value = input.trim();
//     if (!value) return;

//     const q = questions[step];

//     setMessages((m) => [...m, { from: "user", text: value }]);
//     const updatedData = { ...data, [q.key]: value };
//     setData(updatedData);
//     setInput("");

//     if (step + 1 < questions.length) {
//       setTimeout(() => {
//         setMessages((m) => [
//           ...m,
//           { from: "bot", text: questions[step + 1].text }
//         ]);
//         setStep(step + 1);
//       }, 400);
//     } else {
//       submitApplication(updatedData);
//     }
//   };

//   /* ---------------- SUBMIT ---------------- */
//   const submitApplication = async (payload) => {
//     try {
//       await axios.post(`${API}/apply/${slug}`, payload);
//       setMessages((m) => [
//         ...m,
//         { from: "bot", text: "🎉 Application submitted successfully!" }
//       ]);
//     } catch (err) {
//       setMessages((m) => [
//         ...m,
//         {
//           from: "bot",
//           text: err.response?.data?.detail || "Submission failed"
//         }
//       ]);
//     }
//   };

//   return (
//     <div style={styles.page}>
//       <div style={styles.chatCard}>
//         {/* Header */}
//         <div style={styles.header}>💼 Job Application Bot</div>

//         {/* Messages */}
//         <div style={styles.chatBody}>
//           {messages.map((m, i) => (
//             <div
//               key={i}
//               style={{
//                 ...styles.messageRow,
//                 justifyContent:
//                   m.from === "bot" ? "flex-start" : "flex-end"
//               }}
//             >
//               <div
//                 style={{
//                   ...styles.bubble,
//                   ...(m.from === "bot"
//                     ? styles.botBubble
//                     : styles.userBubble)
//                 }}
//               >
//                 {m.text}
//               </div>
//             </div>
//           ))}
//           <div ref={chatEndRef} />
//         </div>

//         {/* Input */}
//         <div style={styles.inputBar}>
//           <input
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && handleSend()}
//             placeholder={
//               jobId ? "Type your answer..." : "Invalid or expired link"
//             }
//             disabled={!jobId}
//             style={styles.input}
//           />
//           <button
//             onClick={handleSend}
//             disabled={!jobId}
//             style={styles.sendBtn}
//           >
//             ➤
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// /* ---------------- STYLES ---------------- */
// const styles = {
//   page: {
//     height: "100vh",
//     background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     fontFamily: "'Inter', sans-serif"
//   },

//   chatCard: {
//     width: 420,
//     height: 560,
//     background: "#fff",
//     borderRadius: 18,
//     boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
//     display: "flex",
//     flexDirection: "column",
//     overflow: "hidden"
//   },

//   header: {
//     padding: "16px 20px",
//     background: "#4f46e5",
//     color: "#fff",
//     fontSize: 16,
//     fontWeight: 600
//   },

//   chatBody: {
//     flex: 1,
//     padding: 16,
//     background: "#f9fafb",
//     overflowY: "auto"
//   },

//   messageRow: {
//     display: "flex",
//     marginBottom: 10
//   },

//   bubble: {
//     maxWidth: "75%",
//     padding: "10px 14px",
//     borderRadius: 14,
//     fontSize: 14,
//     lineHeight: 1.4
//   },

//   botBubble: {
//     background: "#e5e7eb",
//     color: "#111827",
//     borderTopLeftRadius: 4
//   },

//   userBubble: {
//     background: "#4f46e5",
//     color: "#fff",
//     borderTopRightRadius: 4
//   },

//   inputBar: {
//     display: "flex",
//     padding: 12,
//     borderTop: "1px solid #e5e7eb",
//     background: "#fff"
//   },

//   input: {
//     flex: 1,
//     padding: "10px 14px",
//     borderRadius: 12,
//     border: "1px solid #d1d5db",
//     outline: "none",
//     fontSize: 14
//   },

//   sendBtn: {
//     marginLeft: 8,
//     padding: "0 16px",
//     borderRadius: 12,
//     border: "none",
//     background: "#4f46e5",
//     color: "#fff",
//     fontSize: 16,
//     cursor: "pointer"
//   }
// };

// export default PublicJobApply;

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useParams, useLocation } from "react-router-dom";

// const API = process.env.REACT_APP_API_BASE_URL;

// const PublicJobApplyForm = () => {
//   const { slug } = useParams();
//   const location = useLocation();
//   const jobIdFromUrl = new URLSearchParams(location.search).get("job_id");

//   const [jobId, setJobId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     pan: "",
//     aadhaar: "",
//     uan: "",
//     experience: "",
//     current_location: "",
//     willing_to_relocate: "",
//     current_ctc: "",
//     expected_ctc: "",
//     is_referred: "",
//     referral_type: "",
//     referred_by: "",
//     referral_value: "",
//     resume: null,
//   });

//   /* ---------------- VALIDATE APPLY LINK ---------------- */
//   useEffect(() => {
//     const validate = async () => {
//       try {
//         const res = await axios.get(`${API}/apply/${slug}`);
//         setJobId(res.data.job_id);
//       } catch (err) {
//         setError(err.response?.data?.detail || "Invalid application link");
//       } finally {
//         setLoading(false);
//       }
//     };
//     validate();
//   }, [slug]);

//   /* ---------------- HANDLERS ---------------- */
//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "pan") {
//       setForm({
//         ...form,
//         pan: value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10),
//       });
//       return;
//     }

//     if (name === "aadhaar") {
//       setForm({
//         ...form,
//         aadhaar: value.replace(/\D/g, "").slice(0, 12),
//       });
//       return;
//     }

//     if (name === "uan") {
//       setForm({
//         ...form,
//         uan: value.replace(/\D/g, ""),
//       });
//       return;
//     }

//     if (name === "is_referred" && value === "no") {
//       setForm({
//         ...form,
//         is_referred: value,
//         referral_type: "",
//         referred_by: "",
//         referral_value: "",
//       });
//       return;
//     }

//     setForm({ ...form, [name]: value });
//   };

//   const handleFileChange = (e) => {
//     setForm({ ...form, resume: e.target.files[0] });
//   };

//   /* ---------------- SUBMIT ---------------- */
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");
//     setSuccess("");
//     setUploadProgress(0);

//     try {
//       const data = new FormData();

//       Object.entries(form).forEach(([key, value]) => {
//         if (
//           form.is_referred === "no" &&
//           ["referral_type", "referred_by", "referral_value"].includes(key)
//         ) {
//           return;
//         }
//         if (value !== "" && value !== null) {
//           data.append(key, value);
//         }
//       });

//       await axios.post(`${API}/apply/${slug}`, data, {
//         headers: { "Content-Type": "multipart/form-data" },
//         onUploadProgress: (e) => {
//           if (!e.total) return;
//           const percent = Math.round((e.loaded * 100) / e.total);
//           setUploadProgress(percent);
//         },
//       });

//       setSuccess("🎉 Application submitted successfully!");
//     } catch (err) {
//       setError(err.response?.data?.detail || "Submission failed");
//     }
//   };

//   /* ---------------- UI STATES ---------------- */
//   if (loading) return <div className="text-center mt-5">Loading…</div>;
//   if (!jobId)
//     return <div className="text-center mt-5 text-danger">{error}</div>;

//   /* ---------------- FORM UI ---------------- */
//   return (
//     <div className="container py-5">
//       <div className="card shadow-lg p-4 mx-auto" style={{ maxWidth: 720 }}>
//         <h3 className="mb-4 text-center">Job Application</h3>

//         <form onSubmit={handleSubmit}>
//           <input className="form-control mb-3" placeholder="Full Name" name="name" required onChange={handleChange} />
//           <input className="form-control mb-3" type="email" placeholder="Email" name="email" required onChange={handleChange} />
//           <input className="form-control mb-3" placeholder="Mobile Number" name="phone" required onChange={handleChange} />
//           <input className="form-control mb-3" placeholder="PAN" name="pan" required onChange={handleChange} />
//           <input className="form-control mb-3" placeholder="Aadhaar" name="aadhaar" required onChange={handleChange} />
//           <input className="form-control mb-3" placeholder="UAN" name="uan" required onChange={handleChange} />
//           <input className="form-control mb-3" placeholder="Years of Experience" name="experience" required onChange={handleChange} />
//           <input className="form-control mb-3" placeholder="Current Location" name="current_location" required onChange={handleChange} />

//           <select className="form-select mb-3" name="willing_to_relocate" required onChange={handleChange}>
//             <option value="">Willing to Relocate?</option>
//             <option value="Yes">Yes</option>
//             <option value="No">No</option>
//           </select>

//           <input className="form-control mb-3" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />

//           {uploadProgress > 0 && (
//             <div className="progress mb-3">
//               <div
//                 className="progress-bar progress-bar-striped progress-bar-animated"
//                 style={{ width: `${uploadProgress}%` }}
//               >
//                 {uploadProgress}%
//               </div>
//             </div>
//           )}

//           <select className="form-select mb-3" name="is_referred" required onChange={handleChange}>
//             <option value="">Referred by Employee?</option>
//             <option value="yes">Yes</option>
//             <option value="no">No</option>
//           </select>

//           {form.is_referred === "yes" && (
//             <>
//               <select className="form-select mb-3" name="referral_type" required onChange={handleChange}>
//                 <option value="">Referral Type</option>
//                 <option>Employee</option>
//                 <option>Consultant</option>
//                 <option>Vendor</option>
//               </select>

//               <input className="form-control mb-3" placeholder="Referred By (Name)" name="referred_by" required onChange={handleChange} />
//               <input className="form-control mb-3" placeholder="Employee ID / Mobile" name="referral_value" required onChange={handleChange} />
//             </>
//           )}

//           {error && <div className="alert alert-danger">{error}</div>}
//           {success && <div className="alert alert-success">{success}</div>}

//           <button className="btn btn-primary w-100" type="submit">
//             Submit Application
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default PublicJobApplyForm;

import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const PublicJobApplyForm = () => {
  const { slug } = useParams();
  const location = useLocation();

  const jobIdFromUrl = new URLSearchParams(location.search).get("job_id");
  const jobMatchIdFromUrl = new URLSearchParams(location.search).get("job_match_id");

  const [jobId, setJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false); // ✅ NEW

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    pan: "",
    aadhaar: "",
    uan: "",
    current_company: "",
    dob: "",
    experience: "",
    notice_period: "",
    current_location: "",
    willing_to_relocate: "",
    current_ctc: "",
    expected_ctc: "",
    is_referred: "",
    referral_type: "",
    referred_by: "",
    referral_value: "",
    resume: null,
  });

  /* ---------------- VALIDATE APPLY LINK ---------------- */
  useEffect(() => {
    const validate = async () => {
      try {
        const res = await axios.get(`${API}/apply/${slug}`);
        setJobId(res.data.job_id);
      } catch (err) {
        setError(err.response?.data?.detail || "Invalid application link");
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [slug]);

  /* ---------------- HANDLERS ---------------- */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "pan") {
      setForm({ ...form, pan: value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) });
      return;
    }

    if (name === "aadhaar") {
      setForm({ ...form, aadhaar: value.replace(/\D/g, "").slice(0, 12) });
      return;
    }

    if (name === "uan") {
      setForm({ ...form, uan: value.replace(/\D/g, "") });
      return;
    }

    if (["current_ctc", "expected_ctc"].includes(name)) {
      setForm({ ...form, [name]: value.replace(/[^0-9.]/g, "") });
      return;
    }

    if (name === "is_referred" && value === "no") {
      setForm({
        ...form,
        is_referred: value,
        referral_type: "",
        referred_by: "",
        referral_value: "",
      });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, resume: e.target.files[0] });
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUploadProgress(0);

    try {
      const data = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (
          form.is_referred === "no" &&
          ["referral_type", "referred_by", "referral_value"].includes(key)
        ) return;

        if (value !== "" && value !== null) {
          data.append(key, value);
        }
      });

      if (jobIdFromUrl) data.append("job_id", jobIdFromUrl);
      if (jobMatchIdFromUrl) data.append("job_match_id", jobMatchIdFromUrl);

      await axios.post(`${API}/apply/${slug}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (!e.total) return;
          setUploadProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      setIsSubmitted(true); // ✅ freeze form

    } catch (err) {
      setError(err.response?.data?.detail || "Submission failed");
    }
  };

  if (loading) return <div className="text-center mt-5">Loading…</div>;
  if (!jobId) return <div className="text-center mt-5 text-danger">{error}</div>;

  return (
    <div className="container py-5">
      <div className="card shadow-lg p-4 mx-auto" style={{ maxWidth: 720 }}>
        <h3 className="mb-4 text-center">Job Application</h3>

        <form onSubmit={handleSubmit}>
          <input className="form-control mb-3" placeholder="Full Name" name="name" required onChange={handleChange} disabled={isSubmitted} />
          <input className="form-control mb-3" type="email" placeholder="Email" name="email" required onChange={handleChange} disabled={isSubmitted} />
          <input className="form-control mb-3" placeholder="Mobile Number" name="phone" required onChange={handleChange} disabled={isSubmitted} />

          <input className="form-control mb-3" placeholder="Current Company" name="current_company" required onChange={handleChange} disabled={isSubmitted} />

          {/* ✅ FIXED DOB */}
          <input className="form-control mb-3" type="date" name="dob" required onChange={handleChange} disabled={isSubmitted} />

          <input className="form-control mb-3" placeholder="PAN" name="pan" required onChange={handleChange} disabled={isSubmitted} />
          <input className="form-control mb-3" placeholder="Aadhaar" name="aadhaar" required onChange={handleChange} disabled={isSubmitted} />
          <input className="form-control mb-3" placeholder="UAN" name="uan" required onChange={handleChange} disabled={isSubmitted} />

          <input className="form-control mb-3" placeholder="Years of Experience" name="experience" type="number" required onChange={handleChange} disabled={isSubmitted} />
          <input className="form-control mb-3" placeholder="Notice Period (Days)" type="number" name="notice_period" required onChange={handleChange} disabled={isSubmitted} />

          <input className="form-control mb-3" placeholder="Current CTC" name="current_ctc" type="number" required onChange={handleChange} disabled={isSubmitted} />
          <input className="form-control mb-3" placeholder="Expected CTC" name="expected_ctc" type="number" required onChange={handleChange} disabled={isSubmitted} />

          <input className="form-control mb-3" placeholder="Current Location" name="current_location" required onChange={handleChange} disabled={isSubmitted} />

          <select className="form-select mb-3" name="willing_to_relocate" required onChange={handleChange} disabled={isSubmitted}>
            <option value="">Willing to Relocate?</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>

          <input className="form-control mb-3" type="file" accept=".pdf,.doc,.docx" required onChange={handleFileChange} disabled={isSubmitted} />

          {uploadProgress > 0 && (
            <div className="progress mb-3">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                {uploadProgress}%
              </div>
            </div>
          )}

          <button className="btn btn-primary w-100" type="submit" disabled={isSubmitted}>
            {isSubmitted ? "Submitted" : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicJobApplyForm;
