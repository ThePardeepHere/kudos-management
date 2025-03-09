const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_CONFIG = {
  BASE_URL,
  ENDPOINTS: {
    DASHBOARD: {
      STATS: `${BASE_URL}/accounts/dashboard/stats/`,
      LEADERBOARD: `${BASE_URL}/kudos/leaderboard/`,
    },
    AUTH: {
      SIGNUP: `${BASE_URL}/accounts/signup/`,
      LOGIN: `${BASE_URL}/accounts/login/`,
      REFRESH: `${BASE_URL}/accounts/token/refresh/`,
      LOGOUT: `${BASE_URL}/accounts/logout/`,
    },
    KUDOS: {
      LIST: `${BASE_URL}/kudos/`,
      GIVE: `${BASE_URL}/kudos/give/`,
      HISTORY: `${BASE_URL}/kudos/history/`,
      RECEIVED: `${BASE_URL}/kudos/received/`
    },
    USERS: {
      LIST: `${BASE_URL}/accounts/organizations/`,
      PROFILE: `${BASE_URL}/accounts/profile/`,
      ADD: `${BASE_URL}/accounts/organizations/users/add/`
    },
  },
}; 