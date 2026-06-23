import api from './api';

export async function listTeams(championshipId = 'all') {
  const params = championshipId && championshipId !== 'all' ? { championshipId } : {};
  const { data } = await api.get('/teams', { params });
  return data;
}

export async function addTeam(payload) {
  const { data } = await api.post(
    '/teams',
    payload,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return data;
}

export async function updateTeam(id, payload) {
  const { data } = await api.put(`/teams/${id}`, payload);
  return data;
}

export async function deleteTeam(id) {
  const { data } = await api.delete(`/teams/${id}`);
  return data;
}
