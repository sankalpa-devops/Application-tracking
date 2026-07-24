import { useCallback, useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const ATSConfig = () => {

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");

  const [enableAutoFilter, setEnableAutoFilter] = useState(false);
  const [shortlistScore, setShortlistScore] = useState(70);
  const [rejectScore, setRejectScore] = useState(40);

  const token = localStorage.getItem("token");

  // ✅ Make authHeader stable (important fix)
  const authHeader = useCallback(() => ({
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }), [token]);

  // ================= LOAD JOB LIST =================
  const fetchJobs = useCallback(async () => {

    try {
      const res = await fetch(`${API_BASE}/jobs-list`, {
        headers: authHeader()
      });

      const data = await res.json();
      setJobs(data);

    } catch (err) {
      console.error("Fetch jobs error:", err);
    }

  }, [authHeader]);

  // ================= LOAD ATS CONFIG =================
  const fetchConfig = useCallback(async (jobId) => {

    if (!jobId) return;

    try {

      const res = await fetch(`${API_BASE}/ats-config/${jobId}`, {
        headers: authHeader()
      });

      const data = await res.json();

      if (data) {
        setEnableAutoFilter(data.enable_auto_filter);
        setShortlistScore(data.shortlist_score);
        setRejectScore(data.reject_score);
      }

    } catch (err) {
      console.error("Fetch config error:", err);
    }

  }, [authHeader]);

  // ================= SAVE CONFIG =================
  const saveConfig = async () => {

    if (!selectedJob) {
      alert("Select job role first");
      return;
    }

    try {

      await fetch(`${API_BASE}/ats-config/${selectedJob}`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          enable_auto_filter: enableAutoFilter,
          shortlist_score: shortlistScore,
          reject_score: rejectScore
        })
      });

      alert("ATS configuration saved");

    } catch (err) {
      console.error("Save config error:", err);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]); // ✅ fixed

  useEffect(() => {
    fetchConfig(selectedJob);
  }, [selectedJob, fetchConfig]); // ✅ fixed

  return (

    <div>

      <h4 className="mb-3">ATS Auto Screening Configuration</h4>

      <div className="card p-4">

        {/* JOB SELECT */}
        <div className="mb-3">

          <label className="form-label">Select Job Role</label>

          <select
            className="form-select"
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
          >
            <option value="">Select Job</option>

            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>

        </div>

        {/* ENABLE AUTO FILTER */}
        <div className="form-check form-switch mb-3">

          <input
            className="form-check-input"
            type="checkbox"
            checked={enableAutoFilter}
            onChange={(e) => setEnableAutoFilter(e.target.checked)}
          />

          <label className="form-check-label">
            Enable Automatic ATS Screening
          </label>

        </div>

        {/* SHORTLIST SCORE */}
        <div className="mb-3">

          <label className="form-label">Shortlist Score Threshold</label>

          <input
            type="number"
            className="form-control"
            value={shortlistScore}
            onChange={(e) => setShortlistScore(e.target.value)}
          />

          <small className="text-muted">
            Candidates with ATS score above this will be automatically shortlisted.
          </small>

        </div>

        {/* REJECT SCORE */}
        <div className="mb-3">

          <label className="form-label">Reject Score Threshold</label>

          <input
            type="number"
            className="form-control"
            value={rejectScore}
            onChange={(e) => setRejectScore(e.target.value)}
          />

          <small className="text-muted">
            Candidates with ATS score below this will be automatically rejected.
          </small>

        </div>

        {/* SAVE BUTTON */}
        <button
          className="btn btn-primary"
          onClick={saveConfig}
        >
          Save Configuration
        </button>

      </div>

    </div>
  );
};

export default ATSConfig;
