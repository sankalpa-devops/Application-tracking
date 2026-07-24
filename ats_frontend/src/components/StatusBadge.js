// src/components/StatusBadge.js
import React from "react";

const statusColors = {
  Applied: "#6b7280",
  Shortlisted: "#16a34a",
  Interview: "#2563eb",
  Rejected: "#dc2626",
  Hired: "#0f766e",
};

const StatusBadge = ({ status }) => {
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        color: "white",
        backgroundColor: statusColors[status] || "#6b7280",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
