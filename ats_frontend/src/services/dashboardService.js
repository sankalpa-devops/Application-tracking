// 
import axios from "axios";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

export const getHRDashboard = async () => {
  const token = localStorage.getItem("token"); // ✅ get saved token

  const response = await axios.get(`${API}/dashboard/hr`, {
    headers: {
      Authorization: `Bearer ${token}`, // ✅ send token
    },
  });

  return response.data;
};

export const getHRAnalytics = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(`${API}/dashboard/analytics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
