import { useEffect, useMemo, useState } from 'react';
import MatchCard from '../components/MatchCard';
import { addMatch, deleteMatch, listMatches, updateMatch } from '../services/matchService';
import { listChampionships } from '../services/championshipService';
import { listTeams } from '../services/teamService';

export default function Matches() {
  const [championships, setChampionships] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [championshipFilter, setChampionshipFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    campeonato_id: '',
    rodada: 1,
    local: '',
    time_mandante_id: '',
    time_visitante_id: '',
    gols_mandante: 0,
    gols_visitante: 0,
    status: 'agendada',
    data_partida: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    async function init() {
      try {
        const data = await listChampionships();
        setChampionships(data);
        if (data.length > 0) {
          const defaultId = championshipFilter === 'all' ? String(data[0].id) : championshipFilter;
          setChampionshipFilter(defaultId);
          setForm((current) => ({ ...current, campeonato_id: defaultId }));
        }
      } catch (err) {
        setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível carregar os campeonatos.');
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [teamData, matchData] = await Promise.all([
          listTeams(championshipFilter),
          listMatches(championshipFilter),
        ]);
        setTeams(teamData);
        setMatches(matchData);
      } catch (err) {
        setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível carregar as partidas.');
      } finally {
        setLoading(false);
      }
    }

    if (championshipFilter) {
      load();
    }
  }, [championshipFilter]);

  const availableTeams = useMemo(
    () => teams.filter((team) => String(team.campeonato_id) === String(form.campeonato_id)),
    [teams, form.campeonato_id],
  );

  function clearForm() {
    setForm({
      campeonato_id: championshipFilter === 'all' ? String(championships[0]?.id || '') : championshipFilter,
      rodada: 1,
      local: '',
      time_mandante_id: '',
      time_visitante_id: '',
      gols_mandante: 0,
      gols_visitante: 0,
      status: 'agendada',
      data_partida: new Date().toISOString().slice(0, 10),
    });
    setEditing(null);
  }

  async function refreshData(filter = championshipFilter) {
    const [teamData, matchData] = await Promise.all([
      listTeams(filter),
      listMatches(filter),
    ]);
    setTeams(teamData);
    setMatches(matchData);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      const payload = {
        ...form,
        campeonato_id: Number(form.campeonato_id),
        rodada: Number(form.rodada),
        time_mandante_id: Number(form.time_mandante_id),
        time_visitante_id: Number(form.time_visitante_id),
        gols_mandante: Number(form.gols_mandante),
        gols_visitante: Number(form.gols_visitante),
      };

      if (editing) {
        await updateMatch(editing.id, payload);
        setMessage('Partida atualizada com sucesso.');
      } else {
        await addMatch(payload);
        setMessage('Partida criada com sucesso.');
      }

      clearForm();
      await refreshData(championshipFilter);
    } catch (err) {
      setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível salvar a partida.');
    }
  }

  async function handleRemove(id) {
    try {
      await deleteMatch(id);
      setMessage('Partida excluída.');
      await refreshData(championshipFilter);
    } catch (err) {
      setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível excluir a partida.');
    }
  }

  function handleEdit(match) {
    setEditing(match);
    setForm({
      campeonato_id: String(match.campeonato_id),
      rodada: match.rodada,
      local: match.local,
      time_mandante_id: String(match.time_mandante_id),
      time_visitante_id: String(match.time_visitante_id),
      gols_mandante: match.gols_mandante,
      gols_visitante: match.gols_visitante,
      status: match.status,
      data_partida: match.data_partida ? String(match.data_partida).slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <section className="page-grid">
      <div className="panel">
        <div className="section-header">
          <div>
            <h2>Partidas</h2>
            <p>Edite partidas e veja os confrontos do campeonato selecionado.</p>
          </div>

          <label className="field" style={{ minWidth: '240px' }}>
            Campeonato
            <select
              value={championshipFilter}
              onChange={(event) => {
                const value = event.target.value;
                setChampionshipFilter(value);
                setForm((current) => ({
                  ...current,
                  campeonato_id: value === 'all' ? String(championships[0]?.id || '') : value,
                  time_mandante_id: '',
                  time_visitante_id: '',
                }));
              }}
            >
              <option value="all">Todos os campeonatos</option>
              {championships.map((championship) => (
                <option key={championship.id} value={championship.id}>{championship.nome}</option>
              ))}
            </select>
          </label>
        </div>

        {message ? <div className="toast" style={{ marginTop: '16px' }}>{message}</div> : null}

        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid two-cols">
            <label className="field">
              Campeonato
              <select
                value={form.campeonato_id}
                onChange={(event) => setForm((current) => ({ ...current, campeonato_id: event.target.value }))}
                required
              >
                <option value="">Selecione</option>
                {championships.map((championship) => (
                  <option key={championship.id} value={championship.id}>{championship.nome}</option>
                ))}
              </select>
            </label>

            <label className="field">
              Local
              <input
                value={form.local}
                onChange={(event) => setForm((current) => ({ ...current, local: event.target.value }))}
                placeholder="Arena Central"
                required
              />
            </label>
          </div>

          <div className="form-grid four-cols">
            <label className="field">
              Mandante
              <select
                value={form.time_mandante_id}
                onChange={(event) => setForm((current) => ({ ...current, time_mandante_id: event.target.value }))}
                required
              >
                <option value="">Selecione</option>
                {availableTeams.map((team) => (
                  <option key={team.id} value={team.id}>{team.nome}</option>
                ))}
              </select>
            </label>

            <label className="field">
              Visitante
              <select
                value={form.time_visitante_id}
                onChange={(event) => setForm((current) => ({ ...current, time_visitante_id: event.target.value }))}
                required
              >
                <option value="">Selecione</option>
                {availableTeams.map((team) => (
                  <option key={team.id} value={team.id}>{team.nome}</option>
                ))}
              </select>
            </label>

            <label className="field">
              Rodada
              <input
                type="number"
                min="1"
                value={form.rodada}
                onChange={(event) => setForm((current) => ({ ...current, rodada: event.target.value }))}
              />
            </label>

            <label className="field">
              Data
              <input
                type="date"
                value={form.data_partida}
                onChange={(event) => setForm((current) => ({ ...current, data_partida: event.target.value }))}
              />
            </label>
          </div>

          <div className="form-grid four-cols">
            <label className="field">
              Gols mandante
              <input
                type="number"
                min="0"
                value={form.gols_mandante}
                onChange={(event) => setForm((current) => ({ ...current, gols_mandante: event.target.value }))}
              />
            </label>

            <label className="field">
              Gols visitante
              <input
                type="number"
                min="0"
                value={form.gols_visitante}
                onChange={(event) => setForm((current) => ({ ...current, gols_visitante: event.target.value }))}
              />
            </label>

            <label className="field">
              Status
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                <option value="agendada">agendada</option>
                <option value="finalizada">finalizada</option>
              </select>
            </label>

            <div className="field" style={{ alignContent: 'end' }}>
              <button className="button primary" type="submit">
                {editing ? 'Salvar alterações' : 'Adicionar partida'}
              </button>
            </div>
          </div>

          {editing ? (
            <div className="inline-actions">
              <button className="button ghost" type="button" onClick={clearForm}>Cancelar edição</button>
            </div>
          ) : null}
        </form>
      </div>

      <div className="stack">
        {loading ? <div className="toast">Carregando partidas...</div> : null}
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} onEdit={handleEdit} onRemove={handleRemove} />
        ))}
        {!loading && matches.length === 0 ? <div className="toast">Nenhuma partida para o filtro escolhido.</div> : null}
      </div>
    </section>
  );
}
