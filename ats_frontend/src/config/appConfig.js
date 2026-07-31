// src/config/appConfig.js
const APP_CONFIG = {
  BASE_PUBLIC_URL: process.env.REACT_APP_PUBLIC_URL || "http://localhost:3000",
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api"
};

export default APP_CONFIG;
