import api from './api';

export async function listMatches(championshipId = 'all') {
  const params = championshipId && championshipId !== 'all' ? { championshipId } : {};
  const { data } = await api.get('/matches', { params });
  return data;
}

export async function addMatch(payload) {
  const { data } = await api.post('/matches', payload);
  return data;
}

export async function updateMatch(id, payload) {
  const { data } = await api.put(`/matches/${id}`, payload);
  return data;
}

export async function deleteMatch(id) {
  const { data } = await api.delete(`/matches/${id}`);
  return data;
}
