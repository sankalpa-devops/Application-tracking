import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.js";
import {
  deleteAdminUser,
  getAdminActivity,
  getAdminDashboard,
  getAdminUsers,
  updateAdminUser,
} from "../services/adminService.js";
import ATSConfig from "./ATSConfig.js";
import TransferRequestsPage from "./TransferRequestsPage.js";
import LetterheadTemplatesPage from "./LetterheadTemplatesPage.js";

const DEFAULT_PASSWORD = "Atstool@123";
const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const emptyDashboard = {
  metrics: {},
  candidate_status: [],
  candidate_sources: [],
  departments: [],
  recent_jobs: [],
  recent_candidates: [],
};

const Admin = ({ currentUser, onLogout }) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [hrServiceEnabled, setHrServiceEnabled] = useState(true);
  const [blockedFeatures, setBlockedFeatures] = useState({
    "Job Management": false,
    "Job Links": false,
    "Candidates": false,
    "Resume Screening": false,
    "Walk-ins": false,
    "Interviews": false,
    "Joining Forms": false,
    "Blacklist": false,
    "Analytics": false,
    "Transfer Requests": false
  });
  const [retentionMonths, setRetentionMonths] = useState(3);

  const [formData, setFormData] = useState({
    emp_id: "",
    user_name: "",
    role: "HR",
    email: "",
  });

  const metricCards = useMemo(
    () => [
      ["Users", dashboard.metrics.total_users, "Admin and HR accounts"],
      ["Open Jobs", dashboard.metrics.open_jobs, "Active hiring roles"],
      ["Candidates", dashboard.metrics.total_candidates, "Total applicants"],
      ["Shortlisted", dashboard.metrics.shortlisted, "Ready for next step"],
      ["ATS Score", dashboard.metrics.average_ats_score, "Average resume score"],
      ["Conversion", `${dashboard.metrics.conversion_rate || 0}%`, "Shortlist rate"],
      ["Interviews", dashboard.metrics.interviews_scheduled, "Scheduled rounds"],
      ["Walk-ins Today", dashboard.metrics.walkins_today, "Same-day walk-ins"],
    ],
    [dashboard]
  );

  const loadAdminData = async () => {
    setLoading(true);
    setMessage("");

    try {
      const [dashboardData, usersData, activityData] = await Promise.all([
        getAdminDashboard(),
        getAdminUsers(),
        getAdminActivity(),
      ]);

      setDashboard(dashboardData);
      setUsers(usersData);
      setActivity(activityData);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const fetchHrServiceStatus = async () => {
    try {
      const res = await axios.get(`${API}/ats-config/global/hr-service`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data && res.data.hr_service_enabled !== undefined) {
        setHrServiceEnabled(res.data.hr_service_enabled);
      }
    } catch (err) {
      console.error("Error fetching HR service status:", err);
    }
  };

  const fetchBlockedFeatures = async () => {
    try {
      const res = await axios.get(`${API}/ats-config/global/blocked-features`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data) {
        setBlockedFeatures(res.data);
      }
    } catch (err) {
      console.error("Error fetching blocked features:", err);
    }
  };

  const fetchRetentionConfig = async () => {
    try {
      const res = await axios.get(`${API}/ats-config/global/retention`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data && res.data.retention_months !== undefined) {
        setRetentionMonths(res.data.retention_months);
      }
    } catch (err) {
      console.error("Error fetching retention configuration:", err);
    }
  };

  const toggleHrService = async () => {
    const nextState = !hrServiceEnabled;
    try {
      await axios.post(`${API}/ats-config/global/hr-service`, {
        hr_service_enabled: nextState
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setHrServiceEnabled(nextState);
      setMessage(`HR Portal service has been ${nextState ? "enabled" : "disabled"} successfully.`);
    } catch (err) {
      console.error("Error toggling HR service:", err);
      alert("Failed to update HR service status.");
    }
  };

  const handleFeatureToggle = async (featureName) => {
    const nextState = !blockedFeatures[featureName];
    const updated = { ...blockedFeatures, [featureName]: nextState };
    setBlockedFeatures(updated);

    try {
      await axios.post(`${API}/ats-config/global/blocked-features`, {
        [featureName]: nextState
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setMessage(`HR portal feature "${featureName}" has been ${nextState ? "blocked" : "unblocked"} successfully.`);
    } catch (err) {
      console.error("Error toggling feature:", err);
      alert("Failed to update feature control status.");
      setBlockedFeatures({ ...blockedFeatures, [featureName]: !nextState });
    }
  };

  const handleRetentionChange = async (newVal) => {
    if (newVal < 1) return;
    setRetentionMonths(newVal);
    try {
      await axios.post(`${API}/ats-config/global/retention`, {
        retention_months: newVal
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setMessage(`Candidate retention period updated to ${newVal} months.`);
    } catch (err) {
      console.error("Error updating retention period:", err);
      alert("Failed to update retention configuration.");
    }
  };

  useEffect(() => {
    loadAdminData();
    fetchHrServiceStatus();
    fetchBlockedFeatures();
    fetchRetentionConfig();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post(`${API}/auth/register`, {
        ...formData,
        password: DEFAULT_PASSWORD,
      });

      setMessage("User registered successfully");
      setFormData({
        emp_id: "",
        user_name: "",
        role: "HR",
        email: "",
      });
      setShowRegisterModal(false);
      await loadAdminData();
    } catch (err) {
      setMessage(err.response?.data?.detail || err.response?.data?.message || "Error registering user");
    }
  };

  const handleRoleChange = async (empId, role) => {
    setMessage("");

    try {
      const updatedUser = await updateAdminUser(empId, { role });
      setUsers((current) =>
        current.map((user) => (user.emp_id === empId ? updatedUser : user))
      );
      setMessage("User role updated");
      await loadAdminData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to update user");
    }
  };

  const handleDeleteUser = async (empId) => {
    if (!window.confirm("Delete this user account?")) {
      return;
    }

    setMessage("");

    try {
      await deleteAdminUser(empId);
      setUsers((current) => current.filter((user) => user.emp_id !== empId));
      setMessage("User deleted successfully");
      await loadAdminData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to delete user");
    }
  };

  const sidebarItems = [
    { icon: "D", label: "Dashboard", onClick: () => setActivePage("dashboard") },
    { icon: "U", label: "Users", onClick: () => setActivePage("users") },
    { icon: "T", label: "Transfer Requests", onClick: () => setActivePage("transferRequests") },
    { icon: "L", label: "Letterhead Templates", onClick: () => setActivePage("letterheadTemplates") },
    { icon: "A", label: "ATS Config", onClick: () => setActivePage("atsconfig") },
    { icon: "S", label: "Settings", onClick: () => setActivePage("settings") },
  ];

  const renderDistribution = (items, labelKey) => {
    const max = Math.max(...items.map((item) => item.count), 1);

    return (
      <div style={styles.panel}>
        {items.length === 0 && <p style={styles.muted}>No data available.</p>}
        {items.map((item) => (
          <div key={item[labelKey]} style={styles.barRow}>
            <div style={styles.barLabel}>
              <span>{item[labelKey]}</span>
              <strong>{item.count}</strong>
            </div>
            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${Math.max((item.count / max) * 100, 8)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDashboard = () => (
    <div>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.title}>Admin Dashboard</h2>
          <p style={styles.subtitle}>System overview, user control, and hiring health.</p>
        </div>
        <button style={styles.primaryBtn} onClick={loadAdminData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={styles.metricGrid}>
        {metricCards.map(([label, value, helper]) => (
          <div key={label} style={styles.metricCard}>
            <span style={styles.metricLabel}>{label}</span>
            <strong style={styles.metricValue}>{value ?? 0}</strong>
            <small style={styles.muted}>{helper}</small>
          </div>
        ))}
      </div>

      <div style={styles.twoColumn}>
        <section>
          <h3 style={styles.sectionTitle}>Candidate Status</h3>
          {renderDistribution(dashboard.candidate_status, "status")}
        </section>

        <section>
          <h3 style={styles.sectionTitle}>Candidate Sources</h3>
          {renderDistribution(dashboard.candidate_sources, "source")}
        </section>
      </div>

      <div style={styles.twoColumn}>
        <section style={styles.panel}>
          <h3 style={styles.sectionTitle}>Recent Jobs</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Openings</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recent_jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.title}</td>
                  <td>{job.department || "N/A"}</td>
                  <td>{job.status || "N/A"}</td>
                  <td>{job.openings || 0}</td>
                </tr>
              ))}
              {dashboard.recent_jobs.length === 0 && (
                <tr>
                  <td colSpan="4">No jobs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section style={styles.panel}>
          <h3 style={styles.sectionTitle}>Recent Candidates</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Job</th>
                <th>Source</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recent_candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>{candidate.name}</td>
                  <td>{candidate.job}</td>
                  <td>{candidate.source || "N/A"}</td>
                  <td>{candidate.status || "N/A"}</td>
                </tr>
              ))}
              {dashboard.recent_candidates.length === 0 && (
                <tr>
                  <td colSpan="4">No candidates found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );

  const renderUsers = () => (
    <section style={styles.panel}>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.title}>User Management</h2>
          <p style={styles.subtitle}>Create HR/admin users and control access roles.</p>
        </div>
        <button style={styles.primaryBtn} onClick={() => setShowRegisterModal(true)}>
          Add User
        </button>
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.emp_id}>
              <td>{user.emp_id}</td>
              <td>{user.user_name}</td>
              <td>{user.email || "N/A"}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.emp_id, e.target.value)}
                  style={styles.select}
                  disabled={user.emp_id === currentUser?.emp_id}
                >
                  <option value="HR">HR</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </td>
              <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</td>
              <td>
                <button
                  style={styles.dangerBtn}
                  onClick={() => handleDeleteUser(user.emp_id)}
                  disabled={user.emp_id === currentUser?.emp_id}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan="6">No users found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );

  const renderSettings = () => (
    <div style={styles.twoColumn}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <section style={styles.panel}>
          <h2 style={styles.title}>Admin Settings</h2>
          <div style={styles.settingRow}>
            <span>Default new user password</span>
            <strong>{DEFAULT_PASSWORD}</strong>
          </div>
          <div style={styles.settingRow}>
            <span>Admin accounts</span>
            <strong>{dashboard.metrics.admin_users || 0}</strong>
          </div>
          <div style={styles.settingRow}>
            <span>HR accounts</span>
            <strong>{dashboard.metrics.hr_users || 0}</strong>
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.title}>Service Control</h2>
          <p style={styles.subtitle}>Enable or disable access to the HR portal for all HR users.</p>
          <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <div>
              <strong style={{ display: "block" }}>HR Portal Service</strong>
              <span style={{ color: "#6b7280", fontSize: "13px" }}>
                {hrServiceEnabled ? "Service is active" : "Service is suspended"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                className={`btn ${hrServiceEnabled ? "btn-danger" : "btn-success"}`}
                onClick={toggleHrService}
                style={{ padding: "6px 12px", fontSize: "14px", fontWeight: "bold" }}
              >
                {hrServiceEnabled ? "Stop Service" : "Start Service"}
              </button>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.title}>Candidate Data Retention</h2>
          <p style={styles.subtitle}>Specify the number of months rejected candidate data remains in the database before deletion.</p>
          <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
            <div>
              <strong style={{ display: "block" }}>Retention Period</strong>
              <span style={{ color: "#6b7280", fontSize: "13px" }}>
                Profiles and resumes deleted after {retentionMonths} month{retentionMonths > 1 ? "s" : ""}.
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                className="btn btn-secondary"
                onClick={() => handleRetentionChange(retentionMonths - 1)}
                disabled={retentionMonths <= 1}
                style={{ width: "36px", height: "36px", padding: 0, fontSize: "18px", fontWeight: "bold" }}
              >
                -
              </button>
              <strong style={{ fontSize: "16px", minWidth: "24px", textAlign: "center" }}>{retentionMonths}</strong>
              <button
                className="btn btn-secondary"
                onClick={() => handleRetentionChange(retentionMonths + 1)}
                style={{ width: "36px", height: "36px", padding: 0, fontSize: "18px", fontWeight: "bold" }}
              >
                +
              </button>
            </div>
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={styles.title}>Feature Control Panel</h2>
          <p style={styles.subtitle}>Block or unblock specific HR portal features dynamically.</p>
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {Object.keys(blockedFeatures).map((feature) => (
              <div key={feature} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#f9fafb", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                <span style={{ fontWeight: "500", fontSize: "14px" }}>{feature}</span>
                <button
                  onClick={() => handleFeatureToggle(feature)}
                  className={`btn ${blockedFeatures[feature] ? "btn-danger" : "btn-success"}`}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "bold",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {blockedFeatures[feature] ? "Blocked" : "Active"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section style={styles.panel}>
        <h2 style={styles.title}>Recent Activity</h2>
        {activity.length === 0 && <p style={styles.muted}>No recent status activity.</p>}
        {activity.map((item) => (
          <div key={item.id} style={styles.activityItem}>
            <strong>{item.changed_by || "System"}</strong>
            <span>
              changed candidate {item.candidate_id} from {item.old_status || "N/A"} to{" "}
              {item.new_status || "N/A"}
            </span>
          </div>
        ))}
      </section>
    </div>
  );

  const renderPage = () => {
    if (activePage === "atsconfig") {
      return <ATSConfig />;
    }

    if (activePage === "transferRequests") {
      return <TransferRequestsPage currentUser={currentUser} />;
    }

    if (activePage === "letterheadTemplates") {
      return <LetterheadTemplatesPage currentUser={currentUser} />;
    }

    if (activePage === "users") {
      return renderUsers();
    }

    if (activePage === "settings") {
      return renderSettings();
    }

    return renderDashboard();
  };

  return (
    <>
      <Layout
        title="Admin Panel"
        currentUser={currentUser}
        onLogout={onLogout}
        sidebarItems={sidebarItems}
        activePage={activePage}
      >
        {message && <div style={styles.message}>{message}</div>}
        {renderPage()}
      </Layout>

      {showRegisterModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.header}>
              <h3 style={{ margin: 0 }}>Register New User</h3>
              <button
                type="button"
                style={styles.closeBtn}
                onClick={() => setShowRegisterModal(false)}
              >
                x
              </button>
            </div>

            <form onSubmit={handleRegister} style={styles.form}>
              <div style={styles.field}>
                <label>Employee ID</label>
                <input
                  name="emp_id"
                  value={formData.emp_id}
                  onChange={handleChange}
                  placeholder="NEB000"
                  required
                />
              </div>

              <div style={styles.field}>
                <label>User Name</label>
                <input
                  name="user_name"
                  value={formData.user_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={styles.field}>
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleChange}>
                  <option value="HR">HR</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div style={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div style={styles.passwordBox}>
                <span>Default Password</span>
                <strong>{DEFAULT_PASSWORD}</strong>
              </div>

              <div style={styles.actions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowRegisterModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Admin;

const styles = {
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    color: "#111827",
    fontSize: "24px",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },
  metricGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
    marginBottom: "22px",
  },
  metricCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    minHeight: "116px",
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
    fontSize: "30px",
  },
  muted: {
    color: "#6b7280",
  },
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  panel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
  },
  sectionTitle: {
    margin: "0 0 12px",
    fontSize: "18px",
    color: "#111827",
  },
  barRow: {
    marginBottom: "14px",
  },
  barLabel: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "6px",
    color: "#374151",
  },
  barTrack: {
    height: "10px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "#2563eb",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  select: {
    padding: "6px 8px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
  },
  primaryBtn: {
    padding: "9px 14px",
    borderRadius: "6px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  dangerBtn: {
    padding: "7px 10px",
    borderRadius: "6px",
    border: "1px solid #fecaca",
    background: "#fee2e2",
    color: "#991b1b",
    cursor: "pointer",
  },
  message: {
    background: "#eff6ff",
    color: "#1e40af",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "14px",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  activityItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "10px 0",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modal: {
    width: "420px",
    background: "#fff",
    borderRadius: "8px",
    padding: "20px 24px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #eee",
    paddingBottom: "10px",
    marginBottom: "16px",
  },
  closeBtn: {
    border: "none",
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "14px",
  },
  passwordBox: {
    background: "#f5f7fa",
    padding: "10px",
    borderRadius: "6px",
    fontSize: "14px",
    display: "flex",
    justifyContent: "space-between",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "10px",
  },
  cancelBtn: {
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
  },
};
