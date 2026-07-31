// src/components/CandidateDrawer.js
import React, { useState } from "react";
import { sendLOI } from "../services/offerService";

const CandidateDrawer = ({ candidate, onClose, refreshData, hrServiceEnabled }) => {
  const [loiForm, setLoiForm] = useState({
    ctc: "",
    benefits: "",
    response_days: 7,
    send_email: true,
  });
  const [showLoiForm, setShowLoiForm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!candidate) return null;

  const handleSendLOI = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await sendLOI({
        candidate_id: candidate.id,
        job_id: candidate.job_match_id,
        ...loiForm,
      });
      setMessage("Letter of Intent sent successfully!");
      setShowLoiForm(false);
      setLoiForm({ ctc: "", benefits: "", response_days: 7, send_email: true });
      if (refreshData) refreshData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to send LOI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: "400px",
        height: "100%",
        background: "#fff",
        boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
        padding: "16px",
        zIndex: 1000,
        overflowY: "auto",
      }}
    >
      <button onClick={onClose} style={{ float: "right", border: "none", background: "", fontSize: "18px", cursor: "pointer" }}>
        ✖
      </button>

      <h3>{candidate.name}</h3>
      <p><strong>Email:</strong> {candidate.email}</p>
      <p><strong>Phone:</strong> {candidate.phone}</p>
      <p><strong>Experience:</strong> {candidate.experience}</p>
      <p><strong>Notice Period:</strong> {candidate.notice_period}</p>
      <p><strong>Current CTC:</strong> ₹{candidate.current_ctc}</p>
      <p><strong>Expected CTC:</strong> ₹{candidate.expected_ctc}</p>
      <p><strong>Status:</strong> <span className={`badge ${getStatusBadge(candidate.status)}`}>{candidate.status}</span></p>

      <h4>Skills</h4>
      <ul>
        {candidate.skills &&
          (Array.isArray(candidate.skills)
            ? candidate.skills
            : typeof candidate.skills === "string"
            ? candidate.skills.split(",")
            : []
          ).map((s, i) => (
            <li key={i}>{String(s).trim()}</li>
          ))}
      </ul>

      <h4>AI Summary</h4>
      {!hrServiceEnabled ? (
        <div style={{ marginTop: "12px", padding: "12px", borderRadius: "6px", backgroundColor: "#fee2e2", borderLeft: "4px solid #dc3545", color: "#991b1b" }}>
          <strong>AI Screening Suspended</strong>
          <div style={{ fontSize: "13px", marginTop: "4px", color: "#7f1d1d" }}>
            The AI match analysis and recommendation engine is currently turned off by the system administrator.
          </div>
        </div>
      ) : (() => {
        const { summary, recommendation, recommendationColor } = (() => {
          const score = candidate.fitScore || 0;
          const skillsList = Array.isArray(candidate.skills)
            ? candidate.skills
            : typeof candidate.skills === "string"
            ? candidate.skills.split(",")
            : [];
          const expText = candidate.experience ? String(candidate.experience).trim() : "";

          let sum = "";
          let rec = "";
          let color = "";

          if (score >= 75) {
            sum = `Excellent candidate with a high match score of ${score}%. They possess key required skills such as ${skillsList.slice(0, 3).map(s => String(s).trim()).join(", ") || "essential technologies"}. ${expText ? `Their experience background (${expText}) aligns very well with the position requirements.` : "Their professional background strongly fits the role."}`;
            rec = "ACCEPT (Proceed to Interview)";
            color = "#198754"; // Bootstrap Success Green
          } else if (score >= 50) {
            sum = `Moderate candidate matching ${score}% of the job requirements. They have experience/skills in ${skillsList.slice(0, 2).map(s => String(s).trim()).join(", ") || "some key areas"} but may need further screening to verify fit. ${expText ? `Their profile lists ${expText} of experience.` : ""}`;
            rec = "POTENTIAL MATCH (Screening Recommended)";
            color = "#fd7e14"; // Bootstrap Warning Orange
          } else {
            sum = `Low alignment with the role (match score of ${score}%). The candidate's listed skills (${skillsList.slice(0, 2).map(s => String(s).trim()).join(", ") || "none"}) and profile do not meet the core technical threshold for this position.`;
            rec = "REJECT";
            color = "#dc3545"; // Bootstrap Danger Red
          }

          return { summary: sum, recommendation: rec, recommendationColor: color };
        })();

        return (
          <div>
            <p>{summary}</p>
            <div style={{ marginTop: "12px", padding: "10px", borderRadius: "6px", backgroundColor: "#f8f9fa", borderLeft: `4px solid ${recommendationColor}` }}>
              <strong>AI Recommendation: </strong>
              <span style={{ color: recommendationColor, fontWeight: "bold" }}>
                {recommendation}
              </span>
            </div>
          </div>
        );
      })()}

      <div style={{ marginTop: "24px", borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
        {!showLoiForm ? (
          <button
            className="btn btn-primary w-100"
            onClick={() => setShowLoiForm(true)}
            disabled={candidate.status !== "Selected"}
          >
            Send Letter of Intent
          </button>
        ) : (
          <div>
            <h5>Send Letter of Intent</h5>
            {message && <div className={`alert ${message.includes("success") ? "alert-success" : "alert-danger"} py-2`}>{message}</div>}
            <form onSubmit={handleSendLOI}>
              <div className="mb-3">
                <label className="form-label">Offered CTC</label>
                <input
                  type="text"
                  className="form-control"
                  value={loiForm.ctc}
                  onChange={(e) => setLoiForm({ ...loiForm, ctc: e.target.value })}
                  required
                  placeholder="e.g., ₹12,00,000"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Benefits</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={loiForm.benefits}
                  onChange={(e) => setLoiForm({ ...loiForm, benefits: e.target.value })}
                  placeholder="e.g., Health insurance, PF, ESIC"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Response Days</label>
                <input
                  type="number"
                  className="form-control"
                  value={loiForm.response_days}
                  onChange={(e) => setLoiForm({ ...loiForm, response_days: parseInt(e.target.value) })}
                  min="1"
                  max="30"
                />
              </div>
              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="send_email"
                    checked={loiForm.send_email}
                    onChange={(e) => setLoiForm({ ...loiForm, send_email: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="send_email">
                    Send email to candidate
                  </label>
                </div>
              </div>
              <div className="btn-group w-100">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Sending..." : "Send LOI"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowLoiForm(false);
                    setMessage("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusBadge = (status) => {
  switch (status) {
    case "Selected":
      return "bg-success";
    case "Rejected":
      return "bg-danger";
    case "Shortlisted":
      return "bg-info";
    case "Applied":
      return "bg-secondary";
    default:
      return "bg-secondary";
  }
};

export default CandidateDrawer;
