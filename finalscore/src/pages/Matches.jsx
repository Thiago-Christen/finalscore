import { useEffect, useState } from 'react';
import MatchCard from '../components/MatchCard';
import { addMatch, deleteMatch, updateMatch } from '../services/matchService';
import useChampionships from '../hooks/useChampionship';
import useTeams from '../hooks/useTeam';
import useMatches from '../hooks/useMatches';
import useForm from '../hooks/useForm';

export default function Matches() {
  const [championshipFilter, setChampionshipFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const {form,setForm,handleChange,reset} = useForm({campeonato_id: '',rodada: 1,local: '',time_mandante_id: '',time_visitante_id: '',gols_mandante: 0,gols_visitante: 0,status: 'agendada',data_partida: new Date().toISOString().slice(0, 10),});
  const {
  championships,
  error: championshipsError
} = useChampionships();
const {
  teams,
  error: teamsError
} = useTeams(championshipFilter);
  const {
  matches,
  loading,
  error,
  reload
} = useMatches(championshipFilter);

  useEffect(() => {
  if (
    championships.length > 0 &&
    !form.campeonato_id
  ) {
    const defaultId =
      championshipFilter === 'all'
        ? String(championships[0].id)
        : championshipFilter;

    setForm((current) => ({
      ...current,
      campeonato_id: defaultId,
    }));
  }
}, [
  championships,
  championshipFilter,
  form.campeonato_id,
  setForm,
]);

  const availableTeams = teams.filter(
  (team) =>
    String(team.campeonato_id) ===
    String(form.campeonato_id)
);

  function clearForm() {
    reset({
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

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    if (
        form.time_mandante_id ===
        form.time_visitante_id
      ) {
        setMessage(
          'O time mandante e visitante não podem ser iguais.'
        );
        return;
      }

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
      await reload();
    } catch (err) {
      setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível salvar a partida.');
    }
  }

  async function handleRemove(id) {
    try {
      await deleteMatch(id);
      setMessage('Partida excluída.');
      await reload();
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
    window.scrollTo({
      top: 14,
      behavior: 'smooth',
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

          {(message ||
            error ||
            teamsError ||
            championshipsError) && (
            <div
              className="toast"
              style={{ marginTop: "16px" }}
            >
              {message ||
                error ||
                teamsError ||
                championshipsError}
            </div>
          )}

        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid two-cols">
            <label className="field">
              Campeonato
              <select
                name="campeonato_id"
                value={form.campeonato_id}
                onChange={(event) => {
                    handleChange(event);

                    setForm((current) => ({
                      ...current,
                      time_mandante_id: '',
                      time_visitante_id: '',
                    }));
                }}
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
                name="local"
                value={form.local}
                onChange={handleChange}
                placeholder="Arena Central"
                required
              />
            </label>
          </div>

          <div className="form-grid four-cols">
            <label className="field">
              Mandante
              <select
                name="time_mandante_id"
                value={form.time_mandante_id}
                onChange={(event) => {
                  handleChange(event);

                  setForm((current) => ({
                    ...current,
                    time_visitante_id: '',
                  }));
                }}
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
                name="time_visitante_id"
                value={form.time_visitante_id}
                onChange={handleChange}
                required
              >
                <option value="">Selecione</option>
                {availableTeams
                  .filter(
                    (team) =>
                      String(team.id) !==
                      String(form.time_mandante_id)
                  )
                  .map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.nome}
                    </option>
                ))}
              </select>
            </label>

            <label className="field">
              Rodada
              <input
                type="number"
                min="1"
                name="rodada"
                value={form.rodada}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              Data
              <input
                type="date"
                name="data_partida"
                value={form.data_partida}
                onChange={handleChange}

              />
            </label>
          </div>

          <div className="form-grid four-cols">
            <label className="field">
              Gols mandante
              <input
                type="number"
                min="0"
                name="gols_mandante"
                value={form.gols_mandante}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              Gols visitante
              <input
                type="number"
                min="0"
                name="gols_visitante"
                value={form.gols_visitante}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
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
