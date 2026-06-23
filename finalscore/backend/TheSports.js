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
    escudo: team.strBadge,
    forca: Math.floor(Math.random() * 30) + 70,
    ataque: Math.floor(Math.random() * 35) + 65,
    defesa: Math.floor(Math.random() * 35) + 65,
  }));
}

function fallbackTeams() {
  return [
    { nome: 'Aurora FC', cidade: 'Curitiba', estadio: 'Arena Aurora', escudo: null, forca: 92, ataque: 94, defesa: 88 },
    { nome: 'Nexus United', cidade: 'São Paulo', estadio: 'Arena Nexus', escudo: null, forca: 86, ataque: 83, defesa: 84 },
    { nome: 'Vortex Club', cidade: 'Rio de Janeiro', estadio: 'Arena Vortex', escudo: null, forca: 90, ataque: 85, defesa: 89 },
    { nome: 'Atlas City', cidade: 'Belo Horizonte', estadio: 'Arena Atlas', escudo: null, forca: 81, ataque: 78, defesa: 80 },

    { nome: 'Titanes FC', cidade: 'Porto Alegre', estadio: 'Estádio Titan', escudo: null, forca: 85, ataque: 82, defesa: 86 },
    { nome: 'Lobo Azul', cidade: 'Florianópolis', estadio: 'Arena Lobo Azul', escudo: null, forca: 79, ataque: 80, defesa: 77 },
    { nome: 'Fênix FC', cidade: 'Brasília', estadio: 'Arena Fênix', escudo: null, forca: 88, ataque: 90, defesa: 84 },
    { nome: 'Storm Riders', cidade: 'Recife', estadio: 'Storm Arena', escudo: null, forca: 83, ataque: 81, defesa: 82 },
    { nome: 'Cobra Real', cidade: 'Fortaleza', estadio: 'Arena Cobra', escudo: null, forca: 87, ataque: 88, defesa: 85 },
    { nome: 'Gladiators SC', cidade: 'Salvador', estadio: 'Coliseu SC', escudo: null, forca: 84, ataque: 86, defesa: 83 },
  ];
}

function fallbackMatches() {
  return [
    ...Array.from({ length: 8 }).map((_, i) => {
      const data = new Date();
      data.setDate(data.getDate() - (8 - i)); // jogos passados

      return {
        rodada: Math.floor(i / 2) + 1,
        local: `Arena Central ${i + 1}`,
        gols_mandante: Math.floor(Math.random() * 5),
        gols_visitante: Math.floor(Math.random() * 5),
        status: 'finalizada',
        data_partida: data.toISOString().split('T')[0],
      };
    }),

    ...Array.from({ length: 7 }).map((_, i) => {
      const data = new Date();
      data.setDate(data.getDate() + i + 1); // jogos futuros

      return {
        rodada: Math.floor((i + 8) / 2) + 1,
        local: `Arena Agendada ${i + 1}`,
        gols_mandante: 0,
        gols_visitante: 0,
        status: 'agendada',
        data_partida: data.toISOString().split('T')[0],
      };
    }),
  ];
}

function generateRandomMatches() {
  const matches = [];

  const totalMatches = 15;
  const finishedMatches = 8;

  for (let i = 0; i < totalMatches; i++) {
    const finalizada = i < finishedMatches;

    const rodada = Math.floor(i / 3) + 1;

    const data = new Date();
    data.setDate(data.getDate() + i * 2);

    matches.push({
      rodada,
      local: `Estádio ${i + 1}`,
      gols_mandante: finalizada ? Math.floor(Math.random() * 5) : 0,
      gols_visitante: finalizada ? Math.floor(Math.random() * 5) : 0,
      status: finalizada ? 'finalizada' : 'agendada',
      data_partida: data.toISOString().split('T')[0],
    });
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

function buildPairings(teamIndexes, matchLimit = 15) {
  const matches = [];
  const played = new Map(teamIndexes.map(t => [t, 0]));

  function canPlay(a, b) {
    return a !== b;
  }

  while (matches.length < matchLimit) {
    let bestA = null;
    let bestB = null;

    let minSum = Infinity;

    for (let i = 0; i < teamIndexes.length; i++) {
      for (let j = i + 1; j < teamIndexes.length; j++) {
        const a = teamIndexes[i];
        const b = teamIndexes[j];

        if (!canPlay(a, b)) continue;

        const score = (played.get(a) || 0) + (played.get(b) || 0);

        if (score < minSum) {
          minSum = score;
          bestA = a;
          bestB = b;
        }
      }
    }

    if (bestA === null) break;

    matches.push([bestA, bestB]);

    played.set(bestA, (played.get(bestA) || 0) + 1);
    played.set(bestB, (played.get(bestB) || 0) + 1);
  }

  return matches;
}

function buildGeneratedBundle(championship, teams, matches) {
  return {
    campeonato: championship,
    times: teams,
    partidas: matches,
  };
}

function limitMatchesBalanced(pairings, limit = 15) {
  const teamCount = {};

  const result = [];

  for (const [home, away] of pairings) {
    const homeCount = teamCount[home] || 0;
    const awayCount = teamCount[away] || 0;

    // evita um time acumular jogos demais
    if (homeCount >= 4 || awayCount >= 4) continue;

    result.push([home, away]);

    teamCount[home] = homeCount + 1;
    teamCount[away] = awayCount + 1;

    if (result.length >= limit) break;
  }

  return result;
}

async function generateSeedBundle(championship, teamCount = 10) {
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
    escudo: row.escudo,
    forca: Number(row.forca) || 0,
    ataque: Number(row.ataque) || 0,
    defesa: Number(row.defesa) || 0,
    points: 0,
    order: index,
  }));

  const pairings = limitMatchesBalanced(buildPairings(teams.map((_, index) => index)), 15);

  const fallbackPairings = [
    [0, 1],
    [2, 3],
    [0, 2],
    [1, 3],
    [0, 3],
    [1, 2],
  ];

  const matches = matchRows.slice(0, 15).map((row, index) => {
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