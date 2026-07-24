import axios from "axios";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getAdminDashboard = async () => {
  const response = await axios.get(`${API}/admin/dashboard`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await axios.get(`${API}/admin/users`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const updateAdminUser = async (empId, payload) => {
  const response = await axios.patch(`${API}/admin/users/${empId}`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

export const deleteAdminUser = async (empId) => {
  const response = await axios.delete(`${API}/admin/users/${empId}`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getAdminActivity = async () => {
  const response = await axios.get(`${API}/admin/activity`, {
    headers: authHeaders(),
  });
  return response.data;
};
