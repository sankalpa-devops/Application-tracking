import axios from "axios";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const InterviewsPage = () => {

  const [form, setForm] = useState({
    candidate_id: "",
    job_id: "",
    interview_date: "",
    interview_round: ""
  });

  const [interviewers, setInterviewers] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [flow, setFlow] = useState([]);
  const [rounds, setRounds] = useState([""]);
  const [showPopup, setShowPopup] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // HANDLERS
  // =========================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleCandidateSelect = (e) => {
    const selected = candidates.find(
      c => c.candidate_id === e.target.value
    );

    if (!selected) return;

    setForm({
      ...form,
      candidate_id: selected.candidate_id,
      job_id: selected.job_id
    });

    fetchFlow(selected.job_id);
  };

  // =========================
  // ROUND CONFIG
  // =========================
  const addRound = () => {
    setRounds([...rounds, ""]);
  };

  const updateRound = (index, value) => {
    const updated = [...rounds];
    updated[index] = value;
    setRounds(updated);
  };

  const saveFlow = async () => {
    if (!form.job_id) {
      alert("Select candidate/job first");
      return;
    }

    try {
      await axios.post(`${API}/interview-flow`, {
        job_id: form.job_id,
        rounds: rounds
          .map(r => r.trim())
          .filter(Boolean)
          .map(r => ({ round_name: r }))
      });

      alert("Interview rounds saved");
      fetchFlow(form.job_id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error saving interview rounds");
    }
  };

  // =========================
  // API CALLS
  // =========================
  const fetchInterviews = async () => {
    try {
      const res = await axios.get(`${API}/interviews`);

      const sorted = res.data.sort(
        (a, b) => b.interview_id - a.interview_id
      );

      setInterviews(sorted);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Unable to load interviews");
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API}/shortlisted-candidates`);
      setCandidates(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Unable to load shortlisted candidates");
    }
  };

  const fetchFlow = async (job_id) => {
    try {
      const res = await axios.get(`${API}/interview-flow/${job_id}`);
      setFlow(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Unable to load interview flow");
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchCandidates();
  }, []);

  // =========================
  // SUBMIT INTERVIEW
  // =========================
  const submit = async (e) => {
    e.preventDefault();

    const selectedRound = nextRound || flow.find(
      f => f.round_name === form.interview_round
    );

    try {
      await axios.post(`${API}/schedule-interview`, {
        ...form,
        interview_round: nextRound?.round_name || form.interview_round,
        round_order: selectedRound?.round_order || 1,
        interviewers: interviewers
          .split(",")
          .map(i => i.trim())
          .filter(i => i !== "")
      });

      alert("Interview Scheduled");

      setShowPopup(false);
      fetchInterviews();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error scheduling interview");
    }
  };

  // =========================
  // UPDATE STATUS
  // =========================
  const updateStatus = async (id, status, feedback, rating) => {
    try {
      await axios.put(`${API}/update-interview/${id}`, {
        status,
        feedback,
        rating
      });

      fetchInterviews();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error updating interview");
    }
  };

  // =========================
  // SEND OFFER
  // =========================
  const sendOffer = async (candidate_id, job_id) => {
    try {
      await axios.post(`${API}/send-offer`, {
        candidate_id,
        job_id,
        salary: 500000
      });

      alert("Offer Sent");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Error sending offer");
    }
  };

  // =========================
  // EXCEL DOWNLOAD
  // =========================
  const downloadExcel = () => {
    const headers = ["Candidate", "Round", "Status", "Feedback", "Rating"];

    const rows = interviews.map(i => ([
      i.candidate_name,
      i.round_name,
      i.status,
      i.feedback || "",
      i.rating || ""
    ]));

    const sheetData = [headers, ...rows];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Interviews");

    XLSX.writeFile(workbook, "interviews.xlsx");
  };

  // =========================
  // LATEST INTERVIEW PER CANDIDATE
  // =========================
  const latestInterviews = Object.values(
    interviews.reduce((acc, curr) => {
      if (
        !acc[curr.candidate_id] ||
        acc[curr.candidate_id].interview_id < curr.interview_id
      ) {
        acc[curr.candidate_id] = curr;
      }
      return acc;
    }, {})
  );

  // =========================
  // GOOGLE DATE FORMAT
  // =========================
  const formatGoogleDate = (date) => {
    const start = new Date(date);
    const end = new Date(start.getTime() + 30 * 60000);

    const format = (d) =>
      d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    return `${format(start)}/${format(end)}`;
  };

  // =========================
  // NEXT ROUND ONLY
  // =========================
  const getNextRound = () => {
    const candidateInterviews = interviews.filter(
      i => i.candidate_id === form.candidate_id
    );

    const nextOrder = candidateInterviews.length + 1;

    return flow.find(f => f.round_order === nextOrder);
  };

  const nextRound = getNextRound();

  // =========================
  // UI
  // =========================
  return (
    <div className="container">

      <h3>Interview Management</h3>

      {error && (
        <div className="alert alert-danger py-2">
          {error}
        </div>
      )}

      <button
        className="btn btn-primary mb-3"
        onClick={() => setShowPopup(true)}
      >
        Schedule Interview
      </button>

      <button
        className="btn btn-success mb-3 ms-2"
        onClick={downloadExcel}
      >
        Download Excel
      </button>

      {/* ========================= POPUP ========================= */}
      {showPopup && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">

              <div className="modal-header">
                <h5>Schedule Interview</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowPopup(false)}
                />
              </div>

              <div className="modal-body">

                {/* Candidate */}
                <select
                  className="form-control mb-2"
                  onChange={handleCandidateSelect}
                >
                  <option value="">Select Candidate</option>
                  {candidates.map(c => (
                    <option key={c.candidate_id} value={c.candidate_id}>
                      {c.candidate_name} - {c.job_title}
                    </option>
                  ))}
                </select>

                {/* DEFINE ROUNDS */}
                <h6>Define Interview Rounds</h6>

                {rounds.map((r, index) => (
                  <input
                    key={index}
                    value={r}
                    placeholder={`Round ${index + 1}`}
                    className="form-control mb-2"
                    onChange={(e) => updateRound(index, e.target.value)}
                  />
                ))}

                {/* ✅ FIXED BUTTON ALIGNMENT */}
                <div className="d-flex gap-2 mb-3">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={addRound}
                  >
                    + Add Round
                  </button>

                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={saveFlow}
                  >
                    Save Rounds
                  </button>
                </div>

                {/* SCHEDULE FORM */}
                <form onSubmit={submit}>

                  {/* Round (AUTO) */}
                  <input
                    value={nextRound?.round_name || ""}
                    readOnly
                    className="form-control mb-2"
                  />

                  {/* Date */}
                  <input
                    type="datetime-local"
                    name="interview_date"
                    onChange={handleChange}
                    className="form-control mb-2"
                  />

                  {/* Interviewers */}
                  <input
                    placeholder="Interviewers (comma separated)"
                    className="form-control mb-2"
                    onChange={(e) => setInterviewers(e.target.value)}
                  />

                  <button className="btn btn-primary">
                    Schedule
                  </button>

                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================= TABLE ========================= */}
      <table className="table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Round</th>
            <th>Status</th>
            <th>Feedback</th>
            <th>Rating</th>
            <th>Calendar</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {latestInterviews.map(i => {

            let tempFeedback = i.feedback || "";
            let tempRating = i.rating || "";

            return (
              <tr key={i.interview_id}>

                <td>{i.candidate_name}</td>
                <td>{i.round_name}</td>
                <td>{i.status}</td>

                <td>
                  <div
                    contentEditable
                    className="form-control"
                    onInput={(e) => tempFeedback = e.target.innerText}
                    onBlur={() =>
                      updateStatus(i.interview_id, i.status, tempFeedback, tempRating)
                    }
                  >
                    {i.feedback || ""}
                  </div>
                </td>

                <td>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    defaultValue={i.rating || ""}
                    className="form-control"
                    onChange={(e) => tempRating = e.target.value}
                    onBlur={() =>
                      updateStatus(i.interview_id, i.status, tempFeedback, tempRating)
                    }
                  />
                </td>

                <td>
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Interview - ${i.round_name}&details=Candidate: ${i.candidate_name}&dates=${formatGoogleDate(i.interview_date)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-info btn-sm"
                  >
                    Add
                  </a>
                </td>

                <td>
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() =>
                      updateStatus(i.interview_id, "Selected", tempFeedback, tempRating)
                    }
                  >
                    Select
                  </button>

                  <button
                    className="btn btn-danger btn-sm me-2"
                    onClick={() =>
                      updateStatus(i.interview_id, "Rejected", tempFeedback, tempRating)
                    }
                  >
                    Reject
                  </button>

                  {i.status === "Selected" && (
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => sendOffer(i.candidate_id, i.job_id)}
                    >
                      Send Offer
                    </button>
                  )}
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>

    </div>
  );
};

export default InterviewsPage;
