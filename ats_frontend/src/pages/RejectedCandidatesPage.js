import axios from "axios";
import { useEffect, useState } from "react";

// ✅ IMPORTANT: set base URL once
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const RejectedCandidatesPage = ({ currentUser }) => {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");

  const token = localStorage.getItem("token");

  // ================= FETCH JOBS =================
  const fetchJobs = async () => {
    try {
      const res = await axios.get("/candidates/jobs-from-candidates", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Jobs API:", res.data); // 🔍 debug
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs", err);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= FETCH REJECTED =================
  const fetchRejected = async () => {
    if (!selectedJobId) return;

    try {
      const res = await axios.get(
        `/candidates/rejected/${selectedJobId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Rejected API:", res.data); // 🔍 debug
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= UNDO =================
  const undoReject = async (id) => {
    try {
      await axios.patch(
        `/candidates/${id}/undo-reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchRejected();
    } catch (err) {
      alert(err.response?.data?.detail || "Error");
    }
  };

  return (
    <div>
      <h4>Rejected Candidates</h4>

      {/* Dropdown */}
      <div className="d-flex align-items-center gap-2 mb-3">
        <select
          className="form-select"
          style={{ maxWidth: "300px" }}
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
        >
          <option value="">Select Job Title</option>

          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </select>

        <button className="btn btn-primary" onClick={fetchRejected}>
          Load Candidates
        </button>
      </div>

      {/* Table */}
      <div className="card p-3">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {candidates.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.status}</td>
                <td>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => undoReject(c.id)}
                  >
                    Undo Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {candidates.length === 0 && (
          <p className="text-muted">No rejected candidates</p>
        )}
      </div>
    </div>
  );
};

export default RejectedCandidatesPage;
