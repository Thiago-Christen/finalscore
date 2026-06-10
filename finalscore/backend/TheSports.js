async function generateTeamsFromSportsDB(teamCount) {
  const leagues = [
    'Brazilian Serie A',
    'English Premier League',
    'Spanish La Liga',
    'Italian Serie A',
    'French Ligue 1'
  ];

  let allTeams = [];

  for (const league of leagues) {
    try {
      const response = await fetch(
        `https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=${encodeURIComponent(league)}`
      );

      if (!response.ok) continue;

      const data = await response.json();

      if (data.teams?.length) {
        allTeams.push(...data.teams);
      }
    } catch (error) {
      console.error(`Erro ao buscar ${league}:`, error.message);
    }
  }

  if (!allTeams.length) {
    throw new Error('Nenhum time retornado pela API');
  }

  const shuffled = [...allTeams].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, teamCount).map((team) => ({
    nome: team.strTeam,
    cidade: team.strLocation || team.strCountry || 'Desconhecida',
    estadio: team.strStadium || 'Estádio Aleatório',
    cor: [
      '#22C55E',
      '#3B82F6',
      '#F59E0B',
      '#EF4444',
      '#A855F7',
      '#14B8A6',
      '#F97316',
      '#0EA5E9',
    ][Math.floor(Math.random() * 8)],
    forca: Math.floor(Math.random() * 30) + 70,
    ataque: Math.floor(Math.random() * 35) + 65,
    defesa: Math.floor(Math.random() * 35) + 65,
  }));
}

function fallbackTeams() {
  return [
    {
      nome: 'Aurora FC',
      cidade: 'Curitiba',
      estadio: 'Arena Aurora',
      cor: '#22C55E',
      forca: 92,
      ataque: 94,
      defesa: 88,
    },
    {
      nome: 'Nexus United',
      cidade: 'São Paulo',
      estadio: 'Arena Nexus',
      cor: '#3B82F6',
      forca: 86,
      ataque: 83,
      defesa: 84,
    },
    {
      nome: 'Vortex Club',
      cidade: 'Rio de Janeiro',
      estadio: 'Arena Vortex',
      cor: '#F59E0B',
      forca: 90,
      ataque: 85,
      defesa: 89,
    },
    {
      nome: 'Atlas City',
      cidade: 'Belo Horizonte',
      estadio: 'Arena Atlas',
      cor: '#EF4444',
      forca: 81,
      ataque: 78,
      defesa: 80,
    },
  ];
}

function fallbackMatches() {
  return [
    { rodada: 1, local: 'Arena Central', gols_mandante: 2, gols_visitante: 1, status: 'finalizada', data_partida: '2026-05-20' },
    { rodada: 1, local: 'Arena Norte', gols_mandante: 1, gols_visitante: 1, status: 'finalizada', data_partida: '2026-05-20' },
    { rodada: 2, local: 'Estádio Municipal', gols_mandante: 0, gols_visitante: 0, status: 'agendada', data_partida: '2026-05-24' },
    { rodada: 2, local: 'Complexo Esportivo', gols_mandante: 0, gols_visitante: 0, status: 'agendada', data_partida: '2026-05-24' },
    { rodada: 3, local: 'Arena Sul', gols_mandante: 0, gols_visitante: 0, status: 'agendada', data_partida: '2026-05-28' },
    { rodada: 3, local: 'Arena Central', gols_mandante: 0, gols_visitante: 0, status: 'agendada', data_partida: '2026-05-28' },
  ];
}

function generateRandomMatches() {
  const matches = [];

  for (let rodada = 1; rodada <= 3; rodada++) {
    for (let i = 0; i < 2; i++) {
      const finalizada = rodada === 1;

      const data = new Date();
      data.setDate(data.getDate() + (rodada - 1) * 7);

      matches.push({
        rodada,
        gols_mandante: finalizada
          ? Math.floor(Math.random() * 5)
          : 0,
        gols_visitante: finalizada
          ? Math.floor(Math.random() * 5)
          : 0,
        status: finalizada ? 'finalizada' : 'agendada',
        data_partida: data.toISOString().split('T')[0],
      });
    }
  }

  return matches;
}

function shuffle(values) {
  const copy = [...values];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function buildPairings(teamIndexes) {
  if (teamIndexes.length < 2) return [];

  const ids = shuffle(teamIndexes);
  const pairings = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      pairings.push([ids[i], ids[j]]);
    }
  }

  return shuffle(pairings);
}

function buildGeneratedBundle(championship, teams, matches) {
  return {
    campeonato: championship,
    times: teams,
    partidas: matches,
  };
}

async function generateSeedBundle(championship, teamCount = 4) {
  let teamRows = [];
  let matchRows = [];

  try {
    teamRows = await generateTeamsFromSportsDB(teamCount);
    matchRows = generateRandomMatches();
  } catch (error) {
    console.error('Erro TheSportsDB:', error.message);

    teamRows = fallbackTeams().slice(0, teamCount);
    matchRows = generateRandomMatches();
  }

  const teams = teamRows.slice(0, teamCount).map((row, index) => ({
    nome: row.nome,
    cidade: row.cidade,
    estadio: row.estadio,
    cor: row.cor,
    forca: Number(row.forca) || 0,
    ataque: Number(row.ataque) || 0,
    defesa: Number(row.defesa) || 0,
    points: 0,
    order: index,
  }));

  const pairings = buildPairings(teams.map((_, index) => index));

  const fallbackPairings = [
    [0, 1],
    [2, 3],
    [0, 2],
    [1, 3],
    [0, 3],
    [1, 2],
  ];

  const matches = matchRows.slice(0, 6).map((row, index) => {
    const pairing = pairings[index] || fallbackPairings[index] || [0, 1];
    const finalizada = row.status === 'finalizada';

    return {
      rodada: Number(row.rodada) || 1,
      local: teams[pairing[0]].estadio,
      time_mandante_index: pairing[0],
      time_visitante_index: pairing[1],
      gols_mandante: finalizada ? Number(row.gols_mandante) || 0 : 0,
      gols_visitante: finalizada ? Number(row.gols_visitante) || 0 : 0,
      status: finalizada ? 'finalizada' : 'agendada',
      data_partida: row.data_partida,
    };
  });

  return buildGeneratedBundle(championship, teams, matches);
}

module.exports = {
  generateSeedBundle,
};