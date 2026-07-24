import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const ResumeScreening = () => {

  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");

  const token = localStorage.getItem("token");

  // ✅ FIX: memoize authHeader
  const authHeader = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  }), [token]);

  // ================= LOAD JOBS =================
  const fetchJobs = useCallback(async () => {

    try {

      const res = await fetch(`${API_BASE}/jobs-list`, {
        headers: authHeader
      });

      const data = await res.json();
      setJobs(data);

    } catch (err) {
      console.error("Fetch jobs error:", err);
    }

  }, [authHeader]);

  // ================= LOAD CANDIDATES =================
  const fetchCandidates = useCallback(async () => {

    try {

      let url = `${API_BASE}/resume-screening`;

      if (selectedJob) {
        url += `?job_id=${selectedJob}`;
      }

      const res = await fetch(url, {
        headers: authHeader
      });

      const data = await res.json();
      setCandidates(data);

    } catch (err) {
      console.error("Fetch candidates error:", err);
    }

  }, [selectedJob, authHeader]);

  // ================= EFFECTS =================
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // ================= SELECT ONE =================
  const handleSelect = (id) => {

    if (selected.includes(id)) {
      setSelected(selected.filter(c => c !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  // ================= SELECT ALL =================
  const handleSelectAll = (e) => {

    if (e.target.checked) {
      setSelected(candidates.map(c => c.id));
    } else {
      setSelected([]);
    }
  };

  // ================= BULK UPDATE =================
  const bulkUpdate = async (status) => {

    if (selected.length === 0) {
      alert("Select candidates first");
      return;
    }

    try {

      await fetch(`${API_BASE}/candidates/bulk-status`, {
        method: "PUT",
        headers: authHeader,
        body: JSON.stringify({
          candidate_ids: selected,
          status: status
        })
      });

      setSelected([]);
      fetchCandidates();

    } catch (err) {
      console.error("Bulk update error:", err);
    }
  };

  // ================= SINGLE UPDATE =================
  const updateStatus = async (id, status) => {

    try {

      await fetch(`${API_BASE}/candidates/${id}/status`, {
        method: "PUT",
        headers: authHeader,
        body: JSON.stringify({ status })
      });

      fetchCandidates();

    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return (
    <div>

      <h4 className="mb-3">Resume Screening</h4>

      <div className="d-flex align-items-center justify-content-between mb-3">

        <select
          className="form-select"
          style={{ width: "250px" }}
          value={selectedJob}
          onChange={(e) => setSelectedJob(e.target.value)}
        >

          <option value="">All Job Roles</option>

          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}

        </select>

        <div>

          <button
            className="btn btn-success me-2"
            onClick={() => bulkUpdate("Shortlisted")}
          >
            Bulk Shortlist
          </button>

          <button
            className="btn btn-danger"
            onClick={() => bulkUpdate("Rejected")}
          >
            Bulk Reject
          </button>

        </div>

      </div>

      <div className="table-responsive">

        <table className="table table-bordered table-hover">

          <thead className="table-dark">

            <tr>

              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                />
              </th>

              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Experience</th>
              <th>Job Role</th>
              <th>ATS Score</th>
              <th>Matched Skills</th>
              <th>Resume</th>
              <th>Status</th>
              <th>Actions</th>

            </tr>

          </thead>

          <tbody>

            {candidates.length === 0 && (
              <tr>
                <td colSpan="11" className="text-center">
                  No candidates available
                </td>
              </tr>
            )}

            {candidates.map((c) => (

              <tr key={c.id}>

                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    onChange={() => handleSelect(c.id)}
                  />
                </td>

                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.phone}</td>
                <td>{c.experience}</td>
                <td>{c.job_title}</td>

                <td>
                  <span className={
                    c.ats_score >= 80
                      ? "badge bg-success"
                      : c.ats_score >= 60
                      ? "badge bg-warning"
                      : "badge bg-danger"
                  }>
                    {c.ats_score || 0}
                  </span>
                </td>

                <td style={{ maxWidth: "200px" }}>
                  {c.matched_skills}
                </td>

                <td>
                  {c.resume_path && (
                    <a
                      href={c.resume_path}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  )}
                </td>

                <td>
                  <span className={
                    c.status === "Shortlisted"
                      ? "badge bg-success"
                      : c.status === "Rejected"
                      ? "badge bg-danger"
                      : "badge bg-secondary"
                  }>
                    {c.status}
                  </span>
                </td>

                <td>

                  <div className="btn-group btn-group-sm">

                    <button
                      className="btn btn-success"
                      onClick={() => updateStatus(c.id, "Shortlisted")}
                    >
                      Shortlist
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={() => updateStatus(c.id, "Rejected")}
                    >
                      Reject
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
};

export default ResumeScreening;
