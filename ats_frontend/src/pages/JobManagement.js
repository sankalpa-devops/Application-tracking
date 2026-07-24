import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const JobManagement = ({ currentUser }) => {

  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const authHeader = useMemo(() => ({
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  }), [token]);

  const initialFormState = {
    title: "",
    department: "",
    type: "Full-time",
    experience: "",
    skills: "",
    location: "",
    manager: "",
    openings: "",
    status: "Open",
    job_description: ""   // ✅ ADDED
  };

  const [formData, setFormData] = useState(initialFormState);

  // ================= LOAD JOBS =================
  const requestJson = useCallback(async (url, options = {}) => {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const detail = data?.detail || data?.message || "Request failed";
      throw new Error(detail);
    }

    return data;
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      setError("");
      const data = await requestJson(`${API_BASE}/jobs`, {
        headers: authHeader
      });

      setJobs(Array.isArray(data) ? data : []);

    } catch (err) {
      console.error("Fetch jobs error:", err);
      setError(err.message || "Unable to load jobs");
      setJobs([]);
    }
  }, [authHeader, requestJson]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // ================= INPUT =================
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value
    });
  };

  // ================= SAVE JOB =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setSaving(true);

      if (editIndex !== null) {

        const jobId = jobs[editIndex].id;

        await requestJson(`${API_BASE}/jobs/${jobId}`, {
          method: "PUT",
          headers: authHeader,
          body: JSON.stringify(formData)
        });
      } else {

        const newJob = {
          id: crypto.randomUUID(),
          ...formData
        };

        await requestJson(`${API_BASE}/jobs`, {
          method: "POST",
          headers: authHeader,
          body: JSON.stringify(newJob)
        });
      }

      await fetchJobs();
      resetForm();

    } catch (err) {
      console.error("Save job error:", err);
      setError(err.message || "Unable to save job");
    } finally {
      setSaving(false);
    }
  };

  // ================= RESET =================
  const resetForm = () => {
    setFormData(initialFormState);
    setShowForm(false);
    setEditIndex(null);
    setError("");
  };

  // ================= EDIT =================
  const handleEdit = (index) => {

    const { created_by, created_date, version, id, ...editable } =
      jobs[index];

    setFormData(editable);
    setEditIndex(index);
    setShowForm(true);
  };

  // ================= DELETE =================
  const handleDelete = async (index) => {

    if (!window.confirm("Delete this job?")) return;

    try {

      const jobId = jobs[index].id;

      await requestJson(`${API_BASE}/jobs/${jobId}`, {
        method: "DELETE",
        headers: authHeader
      });

      await fetchJobs();

    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Unable to delete job");
    }
  };

  // ================= CLONE =================
  const handleClone = async (index) => {

    try {

      const jobId = jobs[index].id;

      await requestJson(`${API_BASE}/jobs/${jobId}/clone`, {
        method: "POST",
        headers: authHeader
      });

      await fetchJobs();

    } catch (err) {
      console.error("Clone error:", err);
      setError(err.message || "Unable to clone job");
    }
  };

  // ================= ARCHIVE =================
  const handleArchive = async (index) => {

    try {

      const jobId = jobs[index].id;

      await requestJson(`${API_BASE}/jobs/${jobId}/archive`, {
        method: "PATCH",
        headers: authHeader
      });

      await fetchJobs();

    } catch (err) {
      console.error("Archive error:", err);
      setError(err.message || "Unable to archive job");
    }
  };

  // ================= BODY SCROLL FIX =================
  useEffect(() => {
    document.body.classList.toggle("modal-open", showForm);
  }, [showForm]);

  // ================= UI =================
  return (
    <div>

      <div className="d-flex justify-content-between mb-3">
        <h4>Job Profiles</h4>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditIndex(null);
            setFormData(initialFormState);
            setError("");
            setShowForm(true);
          }}
        >
          + Create Job
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {showForm && (
        <>
          <div className="modal fade show" tabIndex="-1" style={{ display: "block" }}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title">
                    {editIndex !== null ? "Edit Job" : "Create Job"}
                  </h5>
                  <button type="button" className="btn-close" onClick={resetForm}></button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">

                      {Object.keys(initialFormState)
                        .filter(field => field !== "job_description") // ✅ keep others same
                        .map((field) => (
                          <div className="col-md-4" key={field}>
                            {field === "type" || field === "status" ? (
                              <select
                                name={field}
                                className="form-control"
                                value={formData[field]}
                                onChange={handleChange}
                              >
                                {field === "type" && (
                                  <>
                                    <option>Full-time</option>
                                    <option>Part-time</option>
                                    <option>Contract</option>
                                    <option>Intern</option>
                                  </>
                                )}
                                {field === "status" && (
                                  <>
                                    <option>Open</option>
                                    <option>Closed</option>
                                    <option>On Hold</option>
                                    <option>Archived</option>
                                  </>
                                )}
                              </select>
                            ) : (
                              <input
                                name={field}
                                type={field === "openings" ? "number" : "text"}
                                placeholder={field}
                                className="form-control"
                                value={formData[field]}
                                onChange={handleChange}
                                required={field === "title"}
                              />
                            )}
                          </div>
                        ))}

                      {/* ✅ JOB DESCRIPTION AT BOTTOM */}
                     <div className="col-md-12">
                        <label className="form-label fw-bold">Job Description</label>
                        <textarea
                          name="job_description"
                          className="form-control"
                          placeholder="Enter job description..."
                          value={formData.job_description}
                          onChange={handleChange}
                          style={{
                            height: "120px",        // ✅ fixed height
                            resize: "none",         // ✅ removes resize handle (extender)
                            overflowY: "auto"       // ✅ enables scrollbar
                          }}
                        />
                      </div>

                    </div>
                  </div>

                  <div className="modal-footer">
                    <button className="btn btn-success" disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                      Cancel
                    </button>
                  </div>

                </form>

              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}

      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>Title</th>
              <th>Department</th>
              <th>Type</th>
              <th>Experience</th>
              <th>Skills</th>
              <th>Location</th>
              <th>Manager</th>
              <th>Openings</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan="11" className="text-center">No jobs created yet</td>
              </tr>
            )}

            {jobs.map((job, index) => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td>{job.department}</td>
                <td>{job.type}</td>
                <td>{job.experience}</td>
                <td>{job.skills}</td>
                <td>{job.location}</td>
                <td>{job.manager}</td>
                <td>{job.openings}</td>
                <td>{job.status}</td>
                <td>{job.created_date}<br /><small>{job.created_by}</small></td>
                <td>
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-warning" onClick={() => handleEdit(index)}>Edit</button>
                    <button className="btn btn-info" onClick={() => handleClone(index)}>Clone</button>
                    <button className="btn btn-secondary" onClick={() => handleArchive(index)}>Archive</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(index)}>Delete</button>
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

export default JobManagement;
