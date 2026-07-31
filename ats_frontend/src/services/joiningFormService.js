import axios from "axios";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getJoiningCandidates = async () => {
  const response = await axios.get(`${API}/joining-forms/candidates`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const createJoiningFormLink = async (payload) => {
  const response = await axios.post(`${API}/joining-forms/links`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getJoiningFormLinks = async () => {
  const response = await axios.get(`${API}/joining-forms/links`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const disableJoiningFormLink = async (linkId) => {
  const response = await axios.patch(
    `${API}/joining-forms/links/${linkId}/disable`,
    {},
    { headers: authHeaders() }
  );
  return response.data;
};

export const getJoiningForms = async () => {
  const response = await axios.get(`${API}/joining-forms`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const validatePublicJoiningFormLink = async (slug) => {
  const response = await axios.get(`${API}/joining-forms/public/${slug}`);
  return response.data;
};

export const getPublicJoiningSubmission = async (slug, editToken) => {
  const response = await axios.get(`${API}/joining-forms/public/${slug}/submission`, {
    params: { edit_token: editToken },
  });
  return response.data;
};

export const submitPublicJoiningForm = async (slug, payload) => {
  const response = await axios.post(`${API}/joining-forms/public/${slug}`, payload);
  return response.data;
};

export const updatePublicJoiningForm = async (slug, payload) => {
  const response = await axios.put(`${API}/joining-forms/public/${slug}`, payload);
  return response.data;
};

export const getJoiningFormDownloadUrl = (slug, editToken) =>
  `${API}/joining-forms/public/${slug}/download?edit_token=${encodeURIComponent(editToken)}`;

export const hrUpdateJoiningForm = async (formId, payload) => {
  const response = await axios.put(`${API}/joining-forms/${formId}`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};
