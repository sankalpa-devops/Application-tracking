import axios from "axios";

const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const sendLOI = async (payload) => {
  const response = await axios.post(`${API}/offers/send-loi`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};

export const sendOffer = async (payload) => {
  const response = await axios.post(`${API}/offers/send-offer`, payload, {
    headers: authHeaders(),
  });
  return response.data;
};
