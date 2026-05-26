const TEAM_FIELDS = [
  { name: 'nome', type: 'Custom List', values: ['Aurora FC', 'Nexus United', 'Vortex Club', 'Atlas City', 'Titanium FC', 'Orion City', 'Lunar FC', 'Vertex Sport'] },
  { name: 'cidade', type: 'Custom List', values: ['Curitiba', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Porto Alegre', 'Salvador', 'Florianópolis', 'Brasília'] },
  { name: 'cor', type: 'Custom List', values: ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#A855F7', '#14B8A6', '#F97316', '#0EA5E9'] },
  { name: 'forca', type: 'Number', min: 70, max: 99, decimals: 0 },
  { name: 'ataque', type: 'Number', min: 65, max: 99, decimals: 0 },
  { name: 'defesa', type: 'Number', min: 65, max: 99, decimals: 0 },
];

const MATCH_FIELDS = [
  { name: 'rodada', type: 'Number', min: 1, max: 6, decimals: 0 },
  { name: 'local', type: 'Custom List', values: ['Arena Central', 'Estádio Municipal', 'Complexo Esportivo', 'Campo Principal', 'Arena Norte', 'Arena Sul'] },
  { name: 'gols_mandante', type: 'Number', min: 0, max: 5, decimals: 0 },
  { name: 'gols_visitante', type: 'Number', min: 0, max: 5, decimals: 0 },
  { name: 'status', type: 'Custom List', values: ['finalizada', 'finalizada', 'finalizada', 'agendada'] },
  { name: 'data_partida', type: 'Date', min: '01/01/2026', max: '12/31/2026', format: '%Y-%m-%d' },
];

function fallbackTeams() {
  return [
    { nome: 'Aurora FC', cidade: 'Curitiba', cor: '#22C55E', forca: 92, ataque: 94, defesa: 88 },
    { nome: 'Nexus United', cidade: 'São Paulo', cor: '#3B82F6', forca: 86, ataque: 83, defesa: 84 },
    { nome: 'Vortex Club', cidade: 'Rio de Janeiro', cor: '#F59E0B', forca: 90, ataque: 85, defesa: 89 },
    { nome: 'Atlas City', cidade: 'Belo Horizonte', cor: '#EF4444', forca: 81, ataque: 78, defesa: 80 },
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

async function generateFromMockaroo(fields, count) {
  const apiKey = process.env.MOCKAROO_API_KEY;
  if (!apiKey) {
    throw new Error('MOCKAROO_API_KEY não configurada');
  }

  const response = await fetch(`https://api.mockaroo.com/api/generate.json?key=${encodeURIComponent(apiKey)}&count=${count}&array=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(fields),
  });

  if (!response.ok) {
    throw new Error(`Mockaroo respondeu com status ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [data];
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildPairings(teamIds) {
  if (teamIds.length < 2) return [];

  const ids = shuffle(teamIds);
  const pairings = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
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
    teamRows = await generateFromMockaroo(TEAM_FIELDS, teamCount);
    matchRows = await generateFromMockaroo(MATCH_FIELDS, 6);
  } catch (error) {
    teamRows = fallbackTeams().slice(0, teamCount);
    matchRows = fallbackMatches();
  }

  const teams = teamRows.slice(0, teamCount).map((row, index) => ({
    nome: row.nome,
    cidade: row.cidade,
    cor: row.cor,
    forca: Number(row.forca) || 0,
    ataque: Number(row.ataque) || 0,
    defesa: Number(row.defesa) || 0,
    points: 0,
    order: index,
  }));

  const pairings = buildPairings(teams.map((team, index) => index + 1));
  const fallbackPairings = [
    [1, 2],
    [3, 4],
    [1, 3],
    [2, 4],
    [1, 4],
    [2, 3],
  ];

  const matches = matchRows.slice(0, 6).map((row, index) => {
    const pairing = pairings[index] || fallbackPairings[index] || [1, 2];
    const finalizada = row.status === 'finalizada';

    return {
      rodada: Number(row.rodada) || 1,
      local: row.local,
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
