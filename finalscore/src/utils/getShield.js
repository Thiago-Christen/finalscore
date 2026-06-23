export function getShieldUrl(escudo) {
  if (!escudo) return '/backend/uploads/Escudo.png';
  if (escudo.startsWith('http')) return escudo;
  return `http://localhost:3002${escudo}`;
}