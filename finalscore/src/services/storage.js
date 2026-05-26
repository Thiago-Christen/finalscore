export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallback);
  }
}

export function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
