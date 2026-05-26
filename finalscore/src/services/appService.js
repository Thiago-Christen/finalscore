import api from './api';

export async function fetchDashboardSummary(championshipId = 'all') {
  const params = championshipId && championshipId !== 'all' ? { championshipId } : {};
  const { data } = await api.get('/dashboard/summary', { params });
  return data;
}

export async function getCurrentApp(championshipId = 'all') {
  return fetchDashboardSummary(championshipId);
}

export function getTeamById(teams, teamId) {
  return teams.find((team) => Number(team.id) === Number(teamId)) || null;
}
