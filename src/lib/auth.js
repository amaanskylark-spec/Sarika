const USERS_KEY = 'sarkia_users';
const SESSION_KEY = 'sarkia_session';

const DEFAULT_USERS = [
  { username: 'WasimShaikh', password: 'W@simSh@ikh' },
  { username: 'AsifShaikh', password: '@sifSh@ikh' },
];

export function initUsers() {
  const existing = localStorage.getItem(USERS_KEY);
  if (!existing) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
  }
}

export function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

export function saveUser(username, password) {
  const users = getUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error('Username already taken');
  }
  users.push({ username, password });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loginUser(username, password) {
  const users = getUsers();
  const user = users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (!user) throw new Error('Invalid username or password.');
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username }));
  return user;
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  const s = localStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
}