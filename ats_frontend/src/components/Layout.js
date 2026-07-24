import React, { useState } from "react";
import useIdleLogout from "../hooks/useIdleLogout";

const Layout = ({
  title,
  currentUser,
  onLogout,
  sidebarItems,
  children,
  activePage
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const { showWarning, stayLoggedIn } = useIdleLogout(onLogout);
  const user = currentUser;

  return (
    <div style={styles.appContainer}>
      {/* ================= NAVBAR ================= */}
      <div style={styles.navbar}>
        <div style={styles.navLeft}>
          <button
            style={styles.menuButton}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <strong style={styles.navTitle}>{title}</strong>
        </div>

        <div style={styles.navRight}>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.user_name}</span>
            <span style={styles.userRole}>{user?.role}</span>
          </div>
          <button style={styles.logoutButton} onClick={onLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* ================= IDLE WARNING MODAL ================= */}
      {showWarning && (
        <div style={styles.warningOverlay}>
          <div style={styles.warningBox}>
            <h3 style={styles.warningTitle}>Session Timeout Warning</h3>
            <p style={styles.warningText}>You will be logged out due to inactivity.</p>
            <button onClick={stayLoggedIn} style={styles.stayBtn}>
              Stay Logged In
            </button>
          </div>
        </div>
      )}

      {/* ================= BODY ================= */}
      <div style={styles.body}>
        {/* -------- SIDEBAR -------- */}
        <div
          style={{
            ...styles.sidebar,
            width: isSidebarOpen ? "260px" : "70px"
          }}
        >
          <div style={styles.sidebarHeader}>
            {isSidebarOpen && <span style={styles.sidebarTitle}>Menu</span>}
          </div>
          {sidebarItems.map((item, index) => {
            const isActive = activePage === item.label || 
                            (activePage?.toLowerCase().includes(item.label.toLowerCase()));
            return (
              <div
                key={index}
                style={{
                  ...styles.sidebarItem,
                  ...(isActive ? styles.sidebarItemActive : {}),
                  ...(!isSidebarOpen ? styles.sidebarItemCollapsed : {})
                }}
                onClick={item.onClick}
                title={!isSidebarOpen ? item.label : ""}
              >
                <span style={styles.sidebarIcon}>{item.icon}</span>
                {isSidebarOpen && (
                  <span style={styles.sidebarLabel}>
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* -------- PAGE CONTENT -------- */}
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;

/* ===================== STYLES ===================== */
const styles = {
  appContainer: {
    height: "100vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column"
  },

  navbar: {
    height: "64px",
    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  },

  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },

  menuButton: {
    background: "rgba(255,255,255,0.1)",
    border: "none",
    borderRadius: "8px",
    padding: "8px",
    cursor: "pointer",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s"
  },

  navTitle: {
    fontSize: "20px",
    fontWeight: "600"
  },

  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },

  userInfo: {
    textAlign: "right"
  },

  userName: {
    display: "block",
    fontWeight: "600",
    fontSize: "14px"
  },

  userRole: {
    display: "block",
    fontSize: "12px",
    opacity: 0.8,
    textTransform: "capitalize"
  },

  logoutButton: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "1px solid rgba(239, 68, 68, 0.5)",
    borderRadius: "6px",
    padding: "8px 16px",
    cursor: "pointer",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s"
  },

  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden"
  },

  sidebar: {
    background: "#1e293b",
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.3s ease",
    boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
    zIndex: 10,
    overflowY: "auto",
    overflowX: "hidden"
  },

  sidebarHeader: {
    padding: "20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)"
  },

  sidebarTitle: {
    fontSize: "14px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    opacity: 0.7
  },

  sidebarItem: {
    padding: "14px 20px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.2s",
    borderLeft: "3px solid transparent",
    pointerEvents: "auto",
    userSelect: "none"
  },

  sidebarItemCollapsed: {
    justifyContent: "center",
    padding: "14px"
  },

  sidebarItemActive: {
    background: "rgba(59, 130, 246, 0.15)",
    borderLeftColor: "#3b82f6",
    color: "#fff"
  },

  sidebarIcon: {
    fontSize: "20px",
    minWidth: "24px",
    textAlign: "center"
  },

  sidebarLabel: {
    fontSize: "14px",
    fontWeight: "500"
  },

  content: {
    flex: 1,
    padding: "24px",
    background: "#f8fafc",
    overflowY: "auto",
    overflowX: "hidden"
  },

  warningOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },

  warningBox: {
    background: "#fff",
    padding: "32px",
    borderRadius: "12px",
    textAlign: "center",
    width: "400px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
  },

  warningTitle: {
    margin: "0 0 12px",
    color: "#1e293b",
    fontSize: "20px"
  },

  warningText: {
    margin: "0 0 20px",
    color: "#64748b",
    fontSize: "14px"
  },

  stayBtn: {
    padding: "12px 24px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "background 0.2s"
  }
};
