// src/components/CandidateTable.js
import { addToBlacklist } from "../services/blacklistService";
import StatusBadge from "./StatusBadge";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const CandidateTable = ({ candidates, onView, refreshData }) => {
  const token = localStorage.getItem("token");

  const handleBlacklist = async (candidate) => {

  const reason = prompt("Enter blacklist reason:");
  if (!reason) return;

  await addToBlacklist(
    {
      candidate_id: candidate.id,
      reason
    },
    token
  );

  alert("Candidate blacklisted");
};

  const updateStatus = async (candidateId, status) => {
    try {
      const res = await fetch(
        `${API}/candidates/${candidateId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!res.ok) throw new Error("Failed");

      await refreshData(); // 🔥 auto refresh table
      alert("Status updated successfully");
    } catch (err) {
      console.error(err);
      alert("Status update failed");
    }
  };

  return (
    <table className="candidate-table" width="100%">
      <thead>
        <tr>
          <th>Name</th>
          <th>Job</th>
          <th>Experience</th>
          <th>Skills</th>
          <th>Fit Score</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {candidates.length === 0 && (
          <tr>
            <td colSpan="7" style={{ textAlign: "center" }}>
              No candidates found
            </td>
          </tr>
        )}

        {candidates.map((c) => (
          <tr key={c.id}>
            {/* From candidates table */}
            <td>{c.name}</td>
            <td>{c.job}</td>
            <td>{c.experience}</td>

            {/* From candidate_ml_data */}
            <td>{(c.skills || []).join(", ")}</td>

            <td>
              <strong
                style={{
                  color:
                    c.fitScore >= 75
                      ? "green"
                      : c.fitScore >= 60
                      ? "orange"
                      : "red",
                }}
              >
                {c.fitScore}%
              </strong>
            </td>

            <td>
              <StatusBadge status={c.status} />
            </td>

           <td>
              <button onClick={() => onView(c)}>View</button>{" "}

              {c.fitScore >= 50 && c.status !== "Shortlisted" && (
                <button onClick={() => updateStatus(c.id, "Shortlisted")}>
                  Shortlist
                </button>
              )}{" "}

              {c.status !== "Rejected" && (
                <button onClick={() => updateStatus(c.id, "Rejected")}>
                  Reject
                </button>
              )}{" "}

              {/* 🔴 BLACKLIST BUTTON */}
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleBlacklist(c)}
              >
                Blacklist
              </button>
          </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CandidateTable;
