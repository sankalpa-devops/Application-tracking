const API = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";

export const getBlacklist = async (token) => {
  const res = await fetch(`${API}/blacklist`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.json();
};

export const addToBlacklist = async (data, token) => {
  return fetch(`${API}/blacklist`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
};

export const whitelistCandidate = async (id, token) => {
  return fetch(`${API}/blacklist/${id}/whitelist`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
  });
};
