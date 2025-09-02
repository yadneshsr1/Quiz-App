// Use relative API base when served by Express, fallback to localhost for dev
const API_BASE = process.env.REACT_APP_API_URL || "/api";

export const CONFIG = {
  API_BASE,
  AUTH_ENDPOINT: `${API_BASE}/auth`,
  QUIZ_ENDPOINT: `${API_BASE}/quizzes`,
  RESULTS_ENDPOINT: `${API_BASE}/results`,
};

export default CONFIG;
