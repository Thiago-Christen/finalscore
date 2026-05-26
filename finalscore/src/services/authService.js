import api from './api';

const TOKEN_KEY = 'finalscore-token';
const USER_KEY = 'finalscore-user';

function persistSession(token, usuario) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (usuario) {
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  }
}

export async function loginUser(email, senha) {
  const { data } = await api.post('/auth/login', { email, senha });
  persistSession(data.token, data.usuario);
  return data.usuario;
}

export async function registerUser(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data.usuario;
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}
