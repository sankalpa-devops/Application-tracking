// src/pages/CandidatesPage.js
import { useCallback, useEffect, useState } from "react";
import CandidateDrawer from "../components/CandidateDrawer";
import CandidateFilters from "../components/CandidateFilters";
import CandidateTable from "../components/CandidateTable";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const CandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [jobFilter, setJobFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Memoized function to avoid ESLint warning
  const fetchCandidates = useCallback(async () => {
    const token = localStorage.getItem("token");

    const params = new URLSearchParams({
      job: jobFilter,
      status: statusFilter,
      search: searchTerm,
    });

    const res = await fetch(
      `${API}/candidates?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    setCandidates(Array.isArray(data) ? data : []);
  }, [jobFilter, statusFilter, searchTerm]); // ✅ dependencies moved here

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]); // ✅ now safe

  return (
    <div className="candidates-page">
      <h2>👥 Candidates</h2>

      <CandidateFilters
        jobFilter={jobFilter}
        statusFilter={statusFilter}
        searchTerm={searchTerm}
        onJobChange={setJobFilter}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchTerm}
      />

      <CandidateTable
        candidates={candidates}
        onView={(c) => setSelectedCandidate(c)}
        refreshData={fetchCandidates}
      />

      <div className="ai-insight" style={{ marginTop: "16px" }}>
        🤖 AI Insight: {candidates.length} candidates match current filters.
      </div>

      <CandidateDrawer
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        refreshData={fetchCandidates}
      />
    </div>
  );
};

export default CandidatesPage;
