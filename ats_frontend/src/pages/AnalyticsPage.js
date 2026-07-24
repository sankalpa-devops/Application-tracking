import { useEffect, useMemo, useState } from "react";
import { getHRAnalytics } from "../services/dashboardService";

const emptyAnalytics = {
  metrics: {},
  candidate_status: [],
  candidate_sources: [],
  top_jobs: [],
  score_bands: [],
  interviews_by_status: [],
  departments: [],
};

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const metrics = useMemo(
    () => [
      ["Candidates", analytics.metrics.total_candidates, "Total applications"],
      ["Open Jobs", analytics.metrics.open_jobs, "Active requisitions"],
      ["Openings", analytics.metrics.total_openings, "Approved headcount"],
      ["Avg ATS Score", analytics.metrics.average_score, "Resume match average"],
      ["Interviews", analytics.metrics.interviews, "Scheduled and completed"],
      ["Offers", analytics.metrics.offers, "Offers generated"],
      ["Selection Rate", `${analytics.metrics.conversion_rate || 0}%`, "Selected candidates"],
      ["Rejection Rate", `${analytics.metrics.rejection_rate || 0}%`, "Rejected candidates"],
    ],
    [analytics]
  );

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getHRAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const renderBars = (items) => {
    const max = Math.max(...items.map((item) => item.count), 1);

    return (
      <div>
        {items.length === 0 && <p style={styles.muted}>No records found.</p>}
        {items.map((item) => (
          <div key={item.label} style={styles.barRow}>
            <div style={styles.barText}>
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
            <div style={styles.track}>
              <div
                style={{
                  ...styles.fill,
                  width: `${Math.max((item.count / max) * 100, 6)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Analytics</h3>
          <p style={styles.subtitle}>Hiring performance, pipeline quality, and source mix.</p>
        </div>
        <button className="btn btn-primary" onClick={loadAnalytics} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div style={styles.metricGrid}>
        {metrics.map(([label, value, helper]) => (
          <div key={label} style={styles.metricCard}>
            <span style={styles.metricLabel}>{label}</span>
            <strong style={styles.metricValue}>{value ?? 0}</strong>
            <small style={styles.muted}>{helper}</small>
          </div>
        ))}
      </div>

      <div style={styles.grid}>
        <section style={styles.panel}>
          <h5 style={styles.panelTitle}>Pipeline Status</h5>
          {renderBars(analytics.candidate_status)}
        </section>

        <section style={styles.panel}>
          <h5 style={styles.panelTitle}>Candidate Sources</h5>
          {renderBars(analytics.candidate_sources)}
        </section>

        <section style={styles.panel}>
          <h5 style={styles.panelTitle}>ATS Score Bands</h5>
          {renderBars(analytics.score_bands)}
        </section>

        <section style={styles.panel}>
          <h5 style={styles.panelTitle}>Interview Status</h5>
          {renderBars(analytics.interviews_by_status)}
        </section>
      </div>

      <div style={styles.tableGrid}>
        <section style={styles.panel}>
          <h5 style={styles.panelTitle}>Top Jobs by Applicants</h5>
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Job</th>
                <th>Department</th>
                <th>Candidates</th>
                <th>Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {analytics.top_jobs.map((job) => (
                <tr key={`${job.title}-${job.department}`}>
                  <td>{job.title}</td>
                  <td>{job.department}</td>
                  <td>{job.candidate_count}</td>
                  <td>{job.average_score}</td>
                </tr>
              ))}
              {analytics.top_jobs.length === 0 && (
                <tr>
                  <td colSpan="4">No job data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section style={styles.panel}>
          <h5 style={styles.panelTitle}>Department Load</h5>
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Department</th>
                <th>Jobs</th>
                <th>Openings</th>
                <th>Candidates</th>
              </tr>
            </thead>
            <tbody>
              {analytics.departments.map((department) => (
                <tr key={department.label}>
                  <td>{department.label}</td>
                  <td>{department.jobs}</td>
                  <td>{department.openings}</td>
                  <td>{department.candidates}</td>
                </tr>
              ))}
              {analytics.departments.length === 0 && (
                <tr>
                  <td colSpan="4">No department data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default AnalyticsPage;

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  metricCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "14px",
    minHeight: "108px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  metricLabel: {
    color: "#4b5563",
    fontWeight: 700,
  },
  metricValue: {
    color: "#111827",
    fontSize: "28px",
  },
  muted: {
    color: "#6b7280",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "14px",
    marginTop: "14px",
  },
  panel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
  },
  panelTitle: {
    margin: "0 0 12px",
    color: "#111827",
  },
  barRow: {
    marginBottom: "12px",
  },
  barText: {
    display: "flex",
    justifyContent: "space-between",
    color: "#374151",
    marginBottom: "5px",
  },
  track: {
    background: "#e5e7eb",
    borderRadius: "999px",
    height: "10px",
    overflow: "hidden",
  },
  fill: {
    background: "#2563eb",
    height: "100%",
  },
};
