const AUTH_KEY = 'family_tree_auth';
const DEFAULT_PASSWORD = 'admin123';

function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function login(password) {
  if (password === DEFAULT_PASSWORD) {
    localStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
}

export { isLoggedIn, login, logout };
