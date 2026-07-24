// // src/components/CandidateFilters.js
// import React from "react";

// const CandidateFilters = ({
//   jobFilter,
//   statusFilter,
//   searchTerm,
//   onJobChange,
//   onStatusChange,
//   onSearchChange,
// }) => {
//   return (
//     <div
//       className="filters"
//       style={{ display: "flex", gap: "12px", marginBottom: "16px" }}
//     >
//       <select value={jobFilter} onChange={(e) => onJobChange(e.target.value)}>
//         <option value="ALL">All Jobs</option>
//         <option value="Frontend Developer">Frontend Developer</option>
//         <option value="Backend Engineer">Backend Engineer</option>
//       </select>

//       <select
//         value={statusFilter}
//         onChange={(e) => onStatusChange(e.target.value)}
//       >
//         <option value="ALL">All Status</option>
//         <option value="Shortlisted">Shortlisted</option>
//         <option value="Interview">Interview</option>
//         <option value="Rejected">Rejected</option>
//       </select>

//       <input
//         type="text"
//         placeholder="Search name / skill"
//         value={searchTerm}
//         onChange={(e) => onSearchChange(e.target.value)}
//         style={{ flex: 1 }}
//       />
//     </div>
//   );
// };

// export default CandidateFilters;

// src/components/CandidateFilters.js
import { useEffect, useState } from "react";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const CandidateFilters = ({
  jobFilter,
  statusFilter,
  searchTerm,
  onJobChange,
  onStatusChange,
  onSearchChange,
}) => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/jobs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    };

    fetchJobs();
  }, []);

  return (
    <div
      className="filters"
      style={{ display: "flex", gap: "12px", marginBottom: "16px" }}
    >
      {/* Job Filter */}
      <select value={jobFilter} onChange={(e) => onJobChange(e.target.value)}>
        <option value="ALL">All Jobs</option>
        {jobs.map((job) => (
          <option key={job.id} value={job.title}>
            {job.title}
          </option>
        ))}
      </select>

      {/* Status Filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="ALL">All Status</option>
        <option value="Applied">Applied</option>
        <option value="Shortlisted">Shortlisted</option>
        <option value="Interview">Interview</option>
        <option value="Rejected">Rejected</option>
      </select>

      {/* Search */}
      <input
        type="text"
        placeholder="Search name / matched skills"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ flex: 1 }}
      />
    </div>
  );
};

export default CandidateFilters;
