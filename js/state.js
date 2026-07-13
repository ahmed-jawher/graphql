const TOKEN_KEY = "token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const profileState = {
  user: null,
  timeline: [],
  skills: [],
  level: null,
  totalXp: null,
  loading: false,
  error: null,
};
