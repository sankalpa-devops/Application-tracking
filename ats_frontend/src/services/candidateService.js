import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

export const fetchCandidates = async (job, status, search) => {
  const response = await axios.get(`${API_BASE}/candidates`, {
    params: {
      job,
      status,
      search,
    },
  });

  return response.data;
};
