// 
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getHRDashboard } from "../services/dashboardService";
import AnalyticsPage from "./AnalyticsPage";
import BlacklistPage from "./BlacklistPage";
import CandidatePage from "./CandidatesPage";
import InterviewsPage from "./InterviewsPage";
import JobLinkManager from "./JobLinkManager";
import JobManagement from "./JobManagement";
import RejectedCandidatesPage from "./RejectedCandidatesPage";
import RejectedTransferRequestsPage from "./RejectedTransferRequestsPage";
import ResumeScreening from "./ResumeScreening";
import TransferRequestsPage from "./TransferRequestsPage";
import WalkInsPage from "./WalkInsPage";
import JoiningFormsPage from "./JoiningFormsPage";
import SubmittedJoiningFormsPage from "./SubmittedJoiningFormsPage";

const HR = ({ currentUser, onLogout }) => {
  const [activePage, setActivePage] = useState("Dashboard");
  const [hrServiceEnabled, setHrServiceEnabled] = useState(true);
  const [blockedFeatures, setBlockedFeatures] = useState({});
  const [checkingService, setCheckingService] = useState(true);

  // ✅ Check HR Service Status and Blocked Features on Mount
  useEffect(() => {
    const initHRConfig = async () => {
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };
      const API_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
      
      try {
        const [resService, resBlocks] = await Promise.all([
          fetch(`${API_URL}/ats-config/global/hr-service`, { headers }),
          fetch(`${API_URL}/ats-config/global/blocked-features`, { headers })
        ]);
        
        const dataService = await resService.json();
        if (dataService && dataService.hr_service_enabled !== undefined) {
          setHrServiceEnabled(dataService.hr_service_enabled);
        }
        
        const dataBlocks = await resBlocks.json();
        if (dataBlocks) {
          setBlockedFeatures(dataBlocks);
        }
      } catch (err) {
        console.error("Error loading HR service configuration:", err);
      } finally {
        setCheckingService(false);
      }
    };
    initHRConfig();
  }, []);

  // ✅ Dashboard State
  const [dashboardData, setDashboardData] = useState({
    open_jobs: 0,
    total_candidates: 0,
    walkins_today: 0,
    shortlisted: 0,
    insights: []
  });

  // ✅ Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getHRDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }
    };

    if (activePage === "Dashboard") {
      fetchDashboard();
    }
  }, [activePage]);

  // Sidebar Items
  const sidebarItems = [
    { icon: "🏠", label: "Dashboard", onClick: () => setActivePage("Dashboard") },
    { icon: "🧾", label: "Job Management", onClick: () => setActivePage("Job Management") },
    { icon: "🔗", label: "Job Links", onClick: () => setActivePage("Job Links") },
    { icon: "👥", label: "Candidates", onClick: () => setActivePage("Candidates") },
    { icon: "📄", label: "Resume Screening", onClick: () => setActivePage("Resume Screening") },
    { icon: "🚶‍♂️", label: "Walk-ins", onClick: () => setActivePage("Walk-ins") },
    { icon: "🎤", label: "Interviews", onClick: () => setActivePage("Interviews") },
    { icon: "📝", label: "Joining Forms", onClick: () => setActivePage("Joining Forms") },
    { icon: "📁", label: "Submitted Forms", onClick: () => setActivePage("Submitted Forms") },
    { icon: "⛔", label: "Blacklist", onClick: () => setActivePage("Blacklist") },
    { icon: "📊", label: "Analytics", onClick: () => setActivePage("Analytics") },
    { icon: "↩️", label: "Rejected", onClick: () => setActivePage("Rejected") },
    { icon: "TR", label: "Transfer Requests", onClick: () => setActivePage("Transfer Requests") },
    { icon: "🚫", label: "Rejected Transfers", onClick: () => setActivePage("Rejected Transfers") },
    { icon: "⚙️", label: "Settings", onClick: () => setActivePage("Settings") }
  ];

  const renderBlockedScreen = (featureName) => (
    <div className="card p-5 text-center" style={{ borderLeft: "4px solid #dc3545", maxWidth: "600px", margin: "40px auto" }}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
      <h4 style={{ color: "#dc3545" }}>{featureName} Service Suspended</h4>
      <p className="text-muted mt-2">
        This specific feature has been temporarily suspended by the system Administrator.
      </p>
      <p className="text-muted small">
        Please contact system administration if you require access to this tool.
      </p>
    </div>
  );

  const renderContent = () => {
    if (blockedFeatures[activePage]) {
      return renderBlockedScreen(activePage);
    }

    switch (activePage) {
      case "Job Management":
        return <JobManagement currentUser={currentUser} onLogout={onLogout} />;

      case "Candidates":
        return <CandidatePage currentUser={currentUser} onLogout={onLogout} hrServiceEnabled={!blockedFeatures["Resume Screening"]} />;

      case "Job Links":
        return <JobLinkManager currentUser={currentUser} onLogout={onLogout} />;

      case "Resume Screening":
        return <ResumeScreening currentUser={currentUser} onLogout={onLogout} />;

      case "Walk-ins":
        return <WalkInsPage currentUser={currentUser} onLogout={onLogout} />;

      case "Rejected":
        return <RejectedCandidatesPage currentUser={currentUser} />;

      case "Interviews":
        return <InterviewsPage currentUser={currentUser} onLogout={onLogout} />;

      case "Joining Forms":
        return <JoiningFormsPage currentUser={currentUser} onLogout={onLogout} />;

      case "Submitted Forms":
        return <SubmittedJoiningFormsPage currentUser={currentUser} onLogout={onLogout} />;

      case "Transfer Requests":
        return <TransferRequestsPage currentUser={currentUser} />;

      case "Rejected Transfers":
        return <RejectedTransferRequestsPage currentUser={currentUser} />;

      case "Blacklist":
        return <BlacklistPage currentUser={currentUser} onLogout={onLogout} />;

      case "Analytics":
        return <AnalyticsPage />;

      case "Settings":
        return renderSettings();

      case "Dashboard":
      default:
        return (
          <>
            <h3 className="mb-4">HR Dashboard</h3>

            <div className="row g-3">
              <div className="col-md-3">
                <div className="card text-center p-3">
                  <h6>Open Jobs</h6>
                  <h4>{dashboardData.open_jobs}</h4>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card text-center p-3">
                  <h6>Total Candidates</h6>
                  <h4>{dashboardData.total_candidates}</h4>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card text-center p-3">
                  <h6>Walk-ins Today</h6>
                  <h4>{dashboardData.walkins_today}</h4>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card text-center p-3">
                  <h6>Shortlisted</h6>
                  <h4>{dashboardData.shortlisted}</h4>
                </div>
              </div>
            </div>

            <div className="card mt-4 p-3">
              <h5>AI Hiring Insights</h5>
              <ul className="mb-0">
                {dashboardData.insights && dashboardData.insights.length > 0 ? (
                  dashboardData.insights.map((insight, index) => (
                    <li key={index}>{insight}</li>
                  ))
                ) : (
                  <li>No insights available</li>
                )}
              </ul>
            </div>
          </>
        );
    }
  };

  const renderSettings = () => (
    <div>
      <h3 className="mb-4">HR Settings</h3>
      <div className="card p-4">
        <div className="row">
          <div className="col-md-6">
            <h5>Profile Information</h5>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                value={currentUser?.user_name || ""}
                disabled
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Employee ID</label>
              <input
                type="text"
                className="form-control"
                value={currentUser?.emp_id || ""}
                disabled
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Role</label>
              <input
                type="text"
                className="form-control"
                value={currentUser?.role || ""}
                disabled
              />
            </div>
          </div>
          <div className="col-md-6">
            <h5>System Preferences</h5>
            <div className="mb-3">
              <label className="form-label">Email Notifications</label>
              <select className="form-select">
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Default View</label>
              <select className="form-select">
                <option value="dashboard">Dashboard</option>
                <option value="candidates">Candidates</option>
                <option value="jobs">Jobs</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <button className="btn btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  );

  if (checkingService) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Layout
      title="HR Dashboard"
      currentUser={currentUser}
      onLogout={onLogout}
      sidebarItems={sidebarItems}
      activePage={activePage}
    >
      {renderContent()}
    </Layout>
  );
};

export default HR;
