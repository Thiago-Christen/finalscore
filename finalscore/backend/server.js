const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = require('./db');
const { generateSeedBundle } = require('./TheSports');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'finalscore-secret';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

app.use(cors());
app.use(express.json());

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      nome: user.nome,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '8h' },
  );
}

function isHashedPassword(value) {
  return typeof value === 'string' && value.startsWith('$2');
}

async function checkPassword(plain, stored) {
  if (isHashedPassword(stored)) {
    return bcrypt.compare(plain, stored);
  }

  return plain === stored;
}

function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ mensagem: 'Token ausente.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ mensagem: 'Token inválido.' });
  }
}

function normalizeId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildResult(golsMandante, golsVisitante) {
  return `${golsMandante} x ${golsVisitante}`;
}

function calculateStandings(teams, matches) {
  const standings = teams.map((team) => ({
    ...team,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    gols_pro: 0,
    gols_contra: 0,
    saldo_gols: 0,
    pontos: Number(team.pontos) || 0,
  }));

  const byId = new Map(standings.map((team) => [team.id, team]));

  matches
    .filter((match) => match.status === 'finalizada')
    .forEach((match) => {
      const home = byId.get(match.time_mandante_id);
      const away = byId.get(match.time_visitante_id);

      if (!home || !away) return;

      const golsMandante = Number(match.gols_mandante) || 0;
      const golsVisitante = Number(match.gols_visitante) || 0;

      home.jogos += 1;
      away.jogos += 1;
      home.gols_pro += golsMandante;
      home.gols_contra += golsVisitante;
      away.gols_pro += golsVisitante;
      away.gols_contra += golsMandante;

      if (golsMandante > golsVisitante) {
        home.vitorias += 1;
        away.derrotas += 1;
        home.pontos += 3;
      } else if (golsMandante < golsVisitante) {
        away.vitorias += 1;
        home.derrotas += 1;
        away.pontos += 3;
      } else {
        home.empates += 1;
        away.empates += 1;
        home.pontos += 1;
        away.pontos += 1;
      }
    });

  return standings
    .map((team) => ({
      ...team,
      saldo_gols: team.gols_pro - team.gols_contra,
    }))
    .sort((a, b) => b.pontos - a.pontos || b.saldo_gols - a.saldo_gols || b.gols_pro - a.gols_pro || a.nome.localeCompare(b.nome));
}

function buildStats(teams, matches) {
  const partidasFinalizadas = matches.filter((match) => match.status === 'finalizada');
  const totalGols = partidasFinalizadas.reduce((sum, match) => sum + (Number(match.gols_mandante) || 0) + (Number(match.gols_visitante) || 0), 0);
  const mediaGols = partidasFinalizadas.length ? (totalGols / partidasFinalizadas.length) : 0;

  return {
    totalTimes: teams.length,
    totalPartidas: matches.length,
    partidasFinalizadas: partidasFinalizadas.length,
    totalGols,
    mediaGols: Number(mediaGols.toFixed(2)),
  };
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS campeonato (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_campeonato_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
      ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campeonato_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estadio VARCHAR(150) NOT NULL,
    cor VARCHAR(50) NOT NULL,
    forca INT DEFAULT 0,
    ataque INT DEFAULT 0,
    defesa INT DEFAULT 0,
    pontos INT DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_times_campeonato
      FOREIGN KEY (campeonato_id) REFERENCES campeonato(id)
      ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS partidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campeonato_id INT NOT NULL,
    rodada INT NOT NULL,
    local VARCHAR(200) NOT NULL,
    time_mandante_id INT NOT NULL,
    time_visitante_id INT NOT NULL,
    gols_mandante INT DEFAULT 0,
    gols_visitante INT DEFAULT 0,
    resultado VARCHAR(20) NOT NULL,
    status ENUM('agendada', 'finalizada') DEFAULT 'agendada',
    data_partida DATE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_partidas_campeonato
      FOREIGN KEY (campeonato_id) REFERENCES campeonato(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_partidas_mandante
      FOREIGN KEY (time_mandante_id) REFERENCES times(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_partidas_visitante
      FOREIGN KEY (time_visitante_id) REFERENCES times(id)
      ON DELETE CASCADE
  )`,
];

async function ensureSchema() {
  for (const statement of SCHEMA_STATEMENTS) {
    await pool.query(statement);
  }
}

async function ensureDemoData() {
  const [championshipRows] = await pool.query('SELECT id FROM campeonato ORDER BY id ASC LIMIT 1');

  if (championshipRows.length > 0) {
    return;
  }

  let userId;

  const [userRows] = await pool.query('SELECT id FROM usuarios ORDER BY id ASC LIMIT 1');
  if (userRows.length > 0) {
    userId = userRows[0].id;
  } else {
    const senhaHash = await bcrypt.hash('123456', BCRYPT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      ['Admin Demo', 'admin@email.com', senhaHash],
    );
    userId = result.insertId;
  }

  const [championshipResult] = await pool.query(
    'INSERT INTO campeonato (usuario_id, nome, descricao) VALUES (?, ?, ?)',
    [userId, 'Campeonato Demo', 'Seed inicial gerado automaticamente'],
  );

  await seedChampionship(championshipResult.insertId, userId);
}

async function bootstrapDatabase() {
  await ensureSchema();
  await ensureDemoData();
}

async function getChampionshipOwner(userId) {
  const [rows] = await pool.query('SELECT id, usuario_id, nome, descricao, criado_em FROM campeonato WHERE usuario_id = ? ORDER BY id DESC', [userId]);
  return rows;
}

async function getUserChampionshipIds(userId) {
  const [rows] = await pool.query('SELECT id FROM campeonato WHERE usuario_id = ?', [userId]);
  return rows.map((row) => row.id);
}

async function assertChampionshipOwnership(championshipId, userId) {
  const [rows] = await pool.query('SELECT id FROM campeonato WHERE id = ? AND usuario_id = ?', [championshipId, userId]);
  return rows.length > 0;
}

async function assertTeamOwnership(teamId, userId) {
  const [rows] = await pool.query(
    `SELECT t.id
       FROM times t
       INNER JOIN campeonato c ON c.id = t.campeonato_id
      WHERE t.id = ? AND c.usuario_id = ?`,
    [teamId, userId],
  );
  return rows.length > 0;
}

async function assertMatchOwnership(matchId, userId) {
  const [rows] = await pool.query(
    `SELECT p.id
       FROM partidas p
       INNER JOIN campeonato c ON c.id = p.campeonato_id
      WHERE p.id = ? AND c.usuario_id = ?`,
    [matchId, userId],
  );
  return rows.length > 0;
}

async function getChampionshipBundle(userId, championshipIdParam) {
  const championships = await getChampionshipOwner(userId);
  const championshipIds = championships.map((item) => item.id);

  let selectedId = null;
  if (championshipIdParam && championshipIdParam !== 'all') {
    selectedId = normalizeId(championshipIdParam);
    if (!selectedId || !championshipIds.includes(selectedId)) {
      selectedId = null;
    }
  }

  const championshipFilter = selectedId ? 'WHERE c.usuario_id = ? AND t.campeonato_id = ?' : 'WHERE c.usuario_id = ?';
  const championshipParams = selectedId ? [userId, selectedId] : [userId];

  const [teamRows] = await pool.query(
    `SELECT t.*
       FROM times t
       INNER JOIN campeonato c ON c.id = t.campeonato_id
      ${championshipFilter}
      ORDER BY t.id ASC`,
    championshipParams,
  );

  const [matchRows] = await pool.query(
    `SELECT p.*
       FROM partidas p
       INNER JOIN campeonato c ON c.id = p.campeonato_id
      ${selectedId ? 'WHERE c.usuario_id = ? AND p.campeonato_id = ?' : 'WHERE c.usuario_id = ?'}
      ORDER BY p.rodada ASC, p.id ASC`,
    selectedId ? [userId, selectedId] : [userId],
  );

  const teamMap = new Map(teamRows.map((team) => [team.id, team]));
  const matches = matchRows.map((match) => ({
    id: match.id,
    campeonato_id: match.campeonato_id,
    rodada: match.rodada,
    local: match.local,
    time_mandante_id: match.time_mandante_id,
    time_visitante_id: match.time_visitante_id,
    time_mandante_nome: teamMap.get(match.time_mandante_id)?.nome || 'Mandante',
    time_visitante_nome: teamMap.get(match.time_visitante_id)?.nome || 'Visitante',
    gols_mandante: match.gols_mandante,
    gols_visitante: match.gols_visitante,
    resultado: match.resultado,
    status: match.status,
    data_partida: match.data_partida,
    criado_em: match.criado_em,
    atualizado_em: match.atualizado_em,
  }));

  const standings = calculateStandings(teamRows, matchRows);
  const stats = buildStats(teamRows, matchRows);

  return {
    championships,
    selectedChampionship: selectedId ? championships.find((item) => item.id === selectedId) || null : championships[0] || null,
    teams: teamRows,
    matches,
    standings,
    stats,
    bestTeam: standings[0] || null,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: 'Preencha nome, email e senha.' });
  }

  if (nome.trim().length < 3) {
  return res.status(400).json({
    mensagem: 'O nome deve possuir pelo menos 3 caracteres.'
  });
  }

  if (!email.includes('@')) {
    return res.status(400).json({
      mensagem: 'Email inválido.'
    });
  }

  if (String(senha).length < 6) {
    return res.status(400).json({
      mensagem: 'A senha deve possuir pelo menos 6 caracteres.'
    });
  }

  const [existing] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing.length > 0) {
    return res.status(409).json({ mensagem: 'Email já cadastrado.' });
  }

  const senhaHash = await bcrypt.hash(String(senha), BCRYPT_ROUNDS);

  const [result] = await pool.query(
    'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
    [nome.trim(), email.trim().toLowerCase(), senhaHash],
  );

  const user = {
    id: result.insertId,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
  };

  const token = signToken(user);

  return res.status(201).json({
    mensagem: 'Usuário criado com sucesso.',
    token,
    usuario: user,
  });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: 'Informe email e senha.' });
  }

  const [rows] = await pool.query(
    'SELECT id, nome, email, senha FROM usuarios WHERE email = ? LIMIT 1',
    [email.trim().toLowerCase()],
  );

  const usuario = rows[0];

  if (!usuario) {
    return res.status(401).json({ mensagem: 'Usuário não encontrado.' });
  }

  const senhaValida = await checkPassword(String(senha), usuario.senha);
  if (!senhaValida) {
    return res.status(401).json({ mensagem: 'Senha inválida.' });
  }

  const user = {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
  };

  return res.json({
    token: signToken(user),
    usuario: user,
  });
}));

app.get('/api/championships', authRequired, asyncHandler(async (req, res) => {
  const championships = await getChampionshipOwner(req.user.id);
  res.json(championships);
}));

app.post('/api/championships', authRequired, asyncHandler(async (req, res) => {
  const { nome, descricao, generateSeed } = req.body;

  if (!nome || !descricao) {
    return res.status(400).json({ mensagem: 'Preencha nome e descrição.' });
  }

  const [result] = await pool.query(
    'INSERT INTO campeonato (usuario_id, nome, descricao) VALUES (?, ?, ?)',
    [req.user.id, nome.trim(), descricao.trim()],
  );

  const championship = {
    id: result.insertId,
    usuario_id: req.user.id,
    nome: nome.trim(),
    descricao: descricao.trim(),
  };

  let generated = null;

  if (generateSeed) {
    generated = await seedChampionship(championship.id, req.user.id);
  }

  return res.status(201).json({
    campeonato: championship,
    gerado: generated,
  });
}));

app.put('/api/championships/:id', authRequired, asyncHandler(async (req, res) => {
  const championshipId = normalizeId(req.params.id);
  const { nome, descricao } = req.body;

  if (!championshipId) {
    return res.status(400).json({ mensagem: 'Campeonato inválido.' });
  }

  const owns = await assertChampionshipOwnership(championshipId, req.user.id);
  if (!owns) {
    return res.status(404).json({ mensagem: 'Campeonato não encontrado.' });
  }

  await pool.query(
    'UPDATE campeonato SET nome = ?, descricao = ? WHERE id = ? AND usuario_id = ?',
    [nome.trim(), descricao.trim(), championshipId, req.user.id],
  );

  res.json({ mensagem: 'Campeonato atualizado.' });
}));

app.delete('/api/championships/:id', authRequired, asyncHandler(async (req, res) => {
  const championshipId = normalizeId(req.params.id);
  if (!championshipId) {
    return res.status(400).json({ mensagem: 'Campeonato inválido.' });
  }

  const owns = await assertChampionshipOwnership(championshipId, req.user.id);
  if (!owns) {
    return res.status(404).json({ mensagem: 'Campeonato não encontrado.' });
  }

  await pool.query('DELETE FROM campeonato WHERE id = ? AND usuario_id = ?', [championshipId, req.user.id]);
  res.json({ mensagem: 'Campeonato excluído.' });
}));

app.post('/api/championships/:id/seed', authRequired, asyncHandler(async (req, res) => {
  const championshipId = normalizeId(req.params.id);
  if (!championshipId) {
    return res.status(400).json({ mensagem: 'Campeonato inválido.' });
  }

  const owns = await assertChampionshipOwnership(championshipId, req.user.id);
  if (!owns) {
    return res.status(404).json({ mensagem: 'Campeonato não encontrado.' });
  }

  const generated = await seedChampionship(championshipId, req.user.id);
  res.status(201).json(generated);
}));

app.get('/api/teams', authRequired, asyncHandler(async (req, res) => {
  const championshipId = req.query.championshipId && req.query.championshipId !== 'all' ? normalizeId(req.query.championshipId) : null;

  let sql = `SELECT t.*
               FROM times t
               INNER JOIN campeonato c ON c.id = t.campeonato_id
              WHERE c.usuario_id = ?`;
  const params = [req.user.id];

  if (championshipId) {
    sql += ' AND t.campeonato_id = ?';
    params.push(championshipId);
  }

  sql += ' ORDER BY t.id ASC';

  const [rows] = await pool.query(sql, params);
  res.json(rows);
}));

app.post('/api/teams', authRequired, asyncHandler(async (req, res) => {
  const {
    campeonato_id,
    nome,
    cidade,
    cor,
    forca = 0,
    ataque = 0,
    defesa = 0,
    pontos = 0,
  } = req.body;

  const championshipId = normalizeId(campeonato_id);
  if (!championshipId || !nome || !cidade || !cor) {
    return res.status(400).json({ mensagem: 'Preencha os campos obrigatórios do time.' });
  }

  const owns = await assertChampionshipOwnership(championshipId, req.user.id);
  if (!owns) {
    return res.status(404).json({ mensagem: 'Campeonato não encontrado.' });
  }

  const [result] = await pool.query(
    `INSERT INTO times (campeonato_id, nome, cidade, cor, forca, ataque, defesa, pontos)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [championshipId, nome.trim(), cidade.trim(), cor, Number(forca) || 0, Number(ataque) || 0, Number(defesa) || 0, Number(pontos) || 0],
  );

  res.status(201).json({
    id: result.insertId,
    campeonato_id: championshipId,
    nome: nome.trim(),
    cidade: cidade.trim(),
    cor,
    forca: Number(forca) || 0,
    ataque: Number(ataque) || 0,
    defesa: Number(defesa) || 0,
    pontos: Number(pontos) || 0,
  });
}));

app.put('/api/teams/:id', authRequired, asyncHandler(async (req, res) => {
  const teamId = normalizeId(req.params.id);
  const {
    campeonato_id,
    nome,
    cidade,
    cor,
    forca = 0,
    ataque = 0,
    defesa = 0,
    pontos = 0,
  } = req.body;

  if (!teamId) {
    return res.status(400).json({ mensagem: 'Time inválido.' });
  }

  const owns = await assertTeamOwnership(teamId, req.user.id);
  if (!owns) {
    return res.status(404).json({ mensagem: 'Time não encontrado.' });
  }

  const championshipId = normalizeId(campeonato_id);
  if (!championshipId) {
    return res.status(400).json({ mensagem: 'Campeonato inválido.' });
  }

  const championshipOwns = await assertChampionshipOwnership(championshipId, req.user.id);
  if (!championshipOwns) {
    return res.status(404).json({ mensagem: 'Campeonato não encontrado.' });
  }

  await pool.query(
    `UPDATE times
        SET campeonato_id = ?, nome = ?, cidade = ?, cor = ?, forca = ?, ataque = ?, defesa = ?, pontos = ?
      WHERE id = ?`,
    [championshipId, nome.trim(), cidade.trim(), cor, Number(forca) || 0, Number(ataque) || 0, Number(defesa) || 0, Number(pontos) || 0, teamId],
  );

  res.json({ mensagem: 'Time atualizado.' });
}));

app.delete('/api/teams/:id', authRequired, asyncHandler(async (req, res) => {
  const teamId = normalizeId(req.params.id);
  if (!teamId) {
    return res.status(400).json({ mensagem: 'Time inválido.' });
  }

  const owns = await assertTeamOwnership(teamId, req.user.id);
  if (!owns) {
    return res.status(404).json({ mensagem: 'Time não encontrado.' });
  }

  await pool.query('DELETE FROM times WHERE id = ?', [teamId]);
  res.json({ mensagem: 'Time excluído.' });
}));

app.get('/api/matches', authRequired, asyncHandler(async (req, res) => {
  const championshipId = req.query.championshipId && req.query.championshipId !== 'all' ? normalizeId(req.query.championshipId) : null;

  let sql = `
    SELECT p.id, p.campeonato_id, p.rodada, p.local, p.time_mandante_id, p.time_visitante_id,
           p.gols_mandante, p.gols_visitante, p.resultado, p.status, p.data_partida,
           p.criado_em, p.atualizado_em,
           tm.nome AS time_mandante_nome,
           tv.nome AS time_visitante_nome
      FROM partidas p
      INNER JOIN campeonato c ON c.id = p.campeonato_id
      LEFT JOIN times tm ON tm.id = p.time_mandante_id
      LEFT JOIN times tv ON tv.id = p.time_visitante_id
     WHERE c.usuario_id = ?`;
  const params = [req.user.id];

  if (championshipId) {
    sql += ' AND p.campeonato_id = ?';
    params.push(championshipId);
  }

  sql += ' ORDER BY p.rodada ASC, p.id ASC';

  const [rows] = await pool.query(sql, params);
  res.json(rows);
}));

app.post('/api/matches', authRequired, asyncHandler(async (req, res) => {
  const {
    campeonato_id,
    rodada,
    local,
    time_mandante_id,
    time_visitante_id,
    gols_mandante = 0,
    gols_visitante = 0,
    status = 'agendada',
    data_partida,
  } = req.body;

  const championshipId = normalizeId(campeonato_id);
  const homeId = normalizeId(time_mandante_id);
  const awayId = normalizeId(time_visitante_id);

  if (homeId === awayId) {
  return res.status(400).json({
    mensagem: 'O time mandante e visitante não podem ser iguais.'
  });
}

  if (!championshipId || !homeId || !awayId || !rodada || !local) {
    return res.status(400).json({ mensagem: 'Preencha os campos obrigatórios da partida.' });
  }

  const owns = await assertChampionshipOwnership(championshipId, req.user.id);
  if (!owns) {
    return res.status(404).json({ mensagem: 'Campeonato não encontrado.' });
  }

  const [teamCheck] = await pool.query(
    `SELECT t.id
       FROM times t
       INNER JOIN campeonato c ON c.id = t.campeonato_id
      WHERE t.id IN (?, ?) AND c.usuario_id = ? AND t.campeonato_id = ?`,
    [homeId, awayId, req.user.id, championshipId],
  );

  if (teamCheck.length < 2) {
    return res.status(400).json({ mensagem: 'Os times precisam pertencer ao mesmo campeonato.' });
  }

  const finalizada = String(status) === 'finalizada';
  const resultado = finalizada ? buildResult(Number(gols_mandante) || 0, Number(gols_visitante) || 0) : 'A definir';

  const [result] = await pool.query(
    `INSERT INTO partidas
      (campeonato_id, rodada, local, time_mandante_id, time_visitante_id, gols_mandante, gols_visitante, resultado, status, data_partida)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      championshipId,
      Number(rodada) || 1,
      local.trim(),
      homeId,
      awayId,
      finalizada ? Number(gols_mandante) || 0 : 0,
      finalizada ? Number(gols_visitante) || 0 : 0,
      resultado,
      finalizada ? 'finalizada' : 'agendada',
      data_partida || null,
    ],
  );

  res.status(201).json({
    id: result.insertId,
    campeonato_id: championshipId,
    rodada: Number(rodada) || 1,
    local: local.trim(),
    time_mandante_id: homeId,
    time_visitante_id: awayId,
    gols_mandante: finalizada ? Number(gols_mandante) || 0 : 0,
    gols_visitante: finalizada ? Number(gols_visitante) || 0 : 0,
    resultado,
    status: finalizada ? 'finalizada' : 'agendada',
    data_partida: data_partida || null,
  });
}));

app.put('/api/matches/:id', authRequired, asyncHandler(async (req, res) => {
  const matchId = normalizeId(req.params.id);
  const {
    campeonato_id,
    rodada,
    local,
    time_mandante_id,
    time_visitante_id,
    gols_mandante = 0,
    gols_visitante = 0,
    status = 'agendada',
    data_partida,
  } = req.body;

  if (!matchId) {
    return res.status(400).json({ mensagem: 'Partida inválida.' });
  }

  const owns = await assertMatchOwnership(matchId, req.user.id);
  if (!owns) {
    return res.status(404).json({ mensagem: 'Partida não encontrada.' });
  }

  const championshipId = normalizeId(campeonato_id);
  const homeId = normalizeId(time_mandante_id);
  const awayId = normalizeId(time_visitante_id);

  if (homeId === awayId) {
  return res.status(400).json({
    mensagem: 'O time mandante e visitante não podem ser iguais.'
  });
}

  if (!championshipId || !homeId || !awayId) {
    return res.status(400).json({ mensagem: 'Campos inválidos.' });
  }

  const championshipOwns = await assertChampionshipOwnership(championshipId, req.user.id);
  if (!championshipOwns) {
    return res.status(404).json({ mensagem: 'Campeonato não encontrado.' });
  }

  const [teamCheck] = await pool.query(
    `SELECT t.id
       FROM times t
       INNER JOIN campeonato c ON c.id = t.campeonato_id
      WHERE t.id IN (?, ?) AND c.usuario_id = ? AND t.campeonato_id = ?`,
    [homeId, awayId, req.user.id, championshipId],
  );

  if (teamCheck.length < 2) {
    return res.status(400).json({ mensagem: 'Os times precisam pertencer ao mesmo campeonato.' });
  }

  const finalizada = String(status) === 'finalizada';
  const resultado = finalizada ? buildResult(Number(gols_mandante) || 0, Number(gols_visitante) || 0) : 'A definir';

  await pool.query(
    `UPDATE partidas
        SET campeonato_id = ?, rodada = ?, local = ?, time_mandante_id = ?, time_visitante_id = ?, gols_mandante = ?, gols_visitante = ?, resultado = ?, status = ?, data_partida = ?
      WHERE id = ?`,
    [
      championshipId,
      Number(rodada) || 1,
      local.trim(),
      homeId,
      awayId,
      finalizada ? Number(gols_mandante) || 0 : 0,
      finalizada ? Number(gols_visitante) || 0 : 0,
      resultado,
      finalizada ? 'finalizada' : 'agendada',
      data_partida || null,
      matchId,
    ],
  );

  res.json({ mensagem: 'Partida atualizada.' });
}));

app.delete('/api/matches/:id', authRequired, asyncHandler(async (req, res) => {
  const matchId = normalizeId(req.params.id);
  if (!matchId) {
    return res.status(400).json({ mensagem: 'Partida inválida.' });
  }

  const owns = await assertMatchOwnership(matchId, req.user.id);
  if (!owns) {
    return res.status(404).json({ mensagem: 'Partida não encontrada.' });
  }

  await pool.query('DELETE FROM partidas WHERE id = ?', [matchId]);
  res.json({ mensagem: 'Partida excluída.' });
}));

app.get('/api/dashboard/summary', authRequired, asyncHandler(async (req, res) => {
  const championshipId = req.query.championshipId && req.query.championshipId !== 'all' ? normalizeId(req.query.championshipId) : null;
  const bundle = await getChampionshipBundle(req.user.id, championshipId ? String(championshipId) : 'all');
  res.json(bundle);
}));

async function seedChampionship(championshipId, userId) {
  const exists = await assertChampionshipOwnership(championshipId, userId);
  if (!exists) {
    throw new Error('Campeonato não encontrado.');
  }

  await pool.query('DELETE FROM partidas WHERE campeonato_id = ?', [championshipId]);
  await pool.query('DELETE FROM times WHERE campeonato_id = ?', [championshipId]);

  const championshipRows = await pool.query('SELECT id, nome, descricao FROM campeonato WHERE id = ? LIMIT 1', [championshipId]);
  const championship = championshipRows[0][0];

  const generated = await generateSeedBundle(championship, 4);

  const teamIds = [];
  for (const team of generated.times) {
    const [result] = await pool.query(
      `INSERT INTO times (campeonato_id, nome, cidade, estadio ,cor, forca, ataque, defesa, pontos)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [championshipId, team.nome, team.cidade, team.estadio ,team.cor, team.forca, team.ataque, team.defesa, team.points || 0],
    );
    teamIds.push(result.insertId);
  }

  const createdMatches = [];
  for (const match of generated.partidas) {
    const homeId =teamIds[match.time_mandante_index]|| teamIds[0];
    const awayId =teamIds[match.time_visitante_index]|| teamIds[1]|| teamIds[0];
    const finalizada = match.status === 'finalizada';
    const resultado = finalizada ? buildResult(match.gols_mandante, match.gols_visitante) : 'A definir';

    if (homeId === awayId) {
      continue;
    }

    const [result] = await pool.query(
      `INSERT INTO partidas
        (campeonato_id, rodada, local, time_mandante_id, time_visitante_id, gols_mandante, gols_visitante, resultado, status, data_partida)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        championshipId,
        match.rodada,
        match.local,
        homeId,
        awayId,
        finalizada ? match.gols_mandante : 0,
        finalizada ? match.gols_visitante : 0,
        resultado,
        finalizada ? 'finalizada' : 'agendada',
        match.data_partida,
      ],
    );

    createdMatches.push({
      id: result.insertId,
      campeonato_id: championshipId,
      rodada: match.rodada,
      local: match.local,
      time_mandante_id: homeId,
      time_visitante_id: awayId,
      gols_mandante: finalizada ? match.gols_mandante : 0,
      gols_visitante: finalizada ? match.gols_visitante : 0,
      resultado,
      status: finalizada ? 'finalizada' : 'agendada',
      data_partida: match.data_partida,
    });
  }

  return {
    campeonato: championship,
    times: generated.times.map((team, index) => ({
      id: teamIds[index],
      campeonato_id: championshipId,
      nome: team.nome,
      cidade: team.cidade,
      cor: team.cor,
      forca: team.forca,
      ataque: team.ataque,
      defesa: team.defesa,
      pontos: team.points || 0,
    })),
    partidas: createdMatches,
  };
}

app.use((err, _req, res, _next) => {
  console.error('ERRO COMPLETO:');
  console.error(err);

  res.status(500).json({
    mensagem: 'Erro interno do servidor.',
    erro: err.message,
    stack: err.stack,
  });
});

async function startServer() {
  try {
    await bootstrapDatabase();
    app.listen(PORT, () => {
      console.log(`API FinalScore rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar a API:', error);
    process.exit(1);
  }
}

startServer();
