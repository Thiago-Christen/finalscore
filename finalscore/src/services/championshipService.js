import api from './api';

export async function listChampionships() {
  const { data } = await api.get('/championships');
  return data;
}

export async function addChampionship(payload) {
  const { data } = await api.post('/championships', payload);
  return data;
}

export async function updateChampionship(id, payload) {
  const { data } = await api.put(`/championships/${id}`, payload);
  return data;
}

export async function deleteChampionship(id) {
  const { data } = await api.delete(`/championships/${id}`);
  return data;
}

export async function generateSeedForChampionship(id) {
  const { data } = await api.post(`/championships/${id}/seed`);
  return data;
}
