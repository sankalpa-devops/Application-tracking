import axios from "axios";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const createLetterheadTemplate = async (payload) => {
  const response = await axios.post(`${API}/letterhead-templates`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getLetterheadTemplates = async (templateType = null) => {
  const params = templateType ? `?template_type=${templateType}` : "";
  const response = await axios.get(`${API}/letterhead-templates${params}`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getLetterheadTemplate = async (templateId) => {
  const response = await axios.get(`${API}/letterhead-templates/${templateId}`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const getDefaultTemplate = async (templateType) => {
  const response = await axios.get(`${API}/letterhead-templates/default/${templateType}`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const updateLetterheadTemplate = async (templateId, payload) => {
  const response = await axios.patch(`${API}/letterhead-templates/${templateId}`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

export const deleteLetterheadTemplate = async (templateId) => {
  const response = await axios.delete(`${API}/letterhead-templates/${templateId}`, {
    headers: authHeaders(),
  });
  return response.data;
};

export const uploadLogo = async (templateId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${API}/letterhead-templates/${templateId}/upload-logo`,
    formData,
    {
      headers: {
        ...authHeaders(),
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
