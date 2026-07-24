import axios from "axios";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const createTransferRequestLink = async (payload) => {
  const response = await axios.post(`${API}/transfer-requests/links`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getTransferRequestLinks = async () => {
  const response = await axios.get(`${API}/transfer-requests/links`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const disableTransferRequestLink = async (linkId) => {
  const response = await axios.patch(
    `${API}/transfer-requests/links/${linkId}/disable`,
    {},
    { headers: authHeaders() }
  );
  return response.data;
};

export const getTransferRequests = async () => {
  const response = await axios.get(`${API}/transfer-requests`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getRejectedTransferRequests = async () => {
  const response = await axios.get(`${API}/transfer-requests?status=Rejected`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const updateTransferRequest = async (requestId, payload) => {
  const response = await axios.patch(`${API}/transfer-requests/${requestId}`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

export const validatePublicTransferLink = async (slug) => {
  const response = await axios.get(`${API}/transfer-requests/public/${slug}`);
  return response.data;
};

export const submitPublicTransferRequest = async (slug, payload) => {
  const response = await axios.post(`${API}/transfer-requests/public/${slug}`, payload);
  return response.data;
};

export const mdApproveTransferRequest = async (requestId, payload) => {
  const response = await axios.post(`${API}/transfer-requests/${requestId}/md-approve`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

export const generateTransferLetter = async (requestId, payload) => {
  const response = await axios.post(`${API}/transfer-requests/${requestId}/generate-letter`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};
