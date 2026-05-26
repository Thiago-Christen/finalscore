import { useEffect, useMemo, useState } from 'react';
import TeamCard from '../components/TeamCard';
import { addTeam, deleteTeam, listTeams, updateTeam } from '../services/teamService';
import { listChampionships } from '../services/championshipService';

const COLOR_SET = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#A855F7', '#14B8A6'];

export default function Teams() {
  const [championships, setChampionships] = useState([]);
  const [championshipFilter, setChampionshipFilter] = useState('all');
  const [teams, setTeams] = useState([]);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    campeonato_id: '',
    nome: '',
    cidade: '',
    cor: COLOR_SET[0],
    forca: 80,
    ataque: 80,
    defesa: 80,
    pontos: 0,
  });

  async function loadChampionships() {
    const data = await listChampionships();
    setChampionships(data);
    if (!form.campeonato_id && data.length > 0) {
      setForm((current) => ({ ...current, campeonato_id: String(data[0].id) }));
      if (championshipFilter === 'all') {
        setChampionshipFilter(String(data[0].id));
      }
    }
  }

  async function loadTeams(filter = championshipFilter) {
    setLoading(true);
    try {
      const data = await listTeams(filter);
      setTeams(data);
    } catch (err) {
      setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível carregar os times.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        await loadChampionships();
      } catch (err) {
        setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível carregar os campeonatos.');
      }
    }
    init();
  }, []);

  useEffect(() => {
    loadTeams(championshipFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [championshipFilter]);

  const filteredChampionships = useMemo(() => championships, [championships]);

  function clearForm() {
    setForm({
      campeonato_id: championshipFilter === 'all' ? String(championships[0]?.id || '') : championshipFilter,
      nome: '',
      cidade: '',
      cor: COLOR_SET[0],
      forca: 80,
      ataque: 80,
      defesa: 80,
      pontos: 0,
    });
    setEditing(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      const payload = {
        ...form,
        campeonato_id: Number(form.campeonato_id),
        forca: Number(form.forca),
        ataque: Number(form.ataque),
        defesa: Number(form.defesa),
        pontos: Number(form.pontos),
      };

      if (editing) {
        await updateTeam(editing.id, payload);
        setMessage('Time atualizado com sucesso.');
      } else {
        await addTeam(payload);
        setMessage('Time criado com sucesso.');
      }

      clearForm();
      await loadTeams(championshipFilter);
    } catch (err) {
      setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível salvar o time.');
    }
  }

  async function handleRemove(id) {
    try {
      await deleteTeam(id);
      setMessage('Time excluído.');
      await loadTeams(championshipFilter);
    } catch (err) {
      setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível excluir o time.');
    }
  }

  function handleEdit(team) {
    setEditing(team);
    setForm({
      campeonato_id: String(team.campeonato_id),
      nome: team.nome,
      cidade: team.cidade,
      cor: team.cor,
      forca: team.forca,
      ataque: team.ataque,
      defesa: team.defesa,
      pontos: team.pontos,
    });
  }

  return (
    <section className="page-grid">
      <div className="panel">
        <div className="section-header">
          <div>
            <h2>Times</h2>
            <p>Edite os times cadastrados no banco e filtre pelo campeonato desejado.</p>
          </div>

          <label className="field" style={{ minWidth: '240px' }}>
            Campeonato
            <select value={championshipFilter} onChange={(event) => setChampionshipFilter(event.target.value)}>
              <option value="all">Todos os campeonatos</option>
              {filteredChampionships.map((championship) => (
                <option key={championship.id} value={championship.id}>
                  {championship.nome}
                </option>
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
              Nome
              <input
                value={form.nome}
                onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                required
              />
            </label>
          </div>

          <div className="form-grid three-cols">
            <label className="field">
              Cidade
              <input
                value={form.cidade}
                onChange={(event) => setForm((current) => ({ ...current, cidade: event.target.value }))}
                required
              />
            </label>
            <label className="field">
              Força
              <input
                type="number"
                min="0"
                max="100"
                value={form.forca}
                onChange={(event) => setForm((current) => ({ ...current, forca: event.target.value }))}
              />
            </label>
            <label className="field">
              Ataque
              <input
                type="number"
                min="0"
                max="100"
                value={form.ataque}
                onChange={(event) => setForm((current) => ({ ...current, ataque: event.target.value }))}
              />
            </label>
          </div>

          <div className="form-grid three-cols">
            <label className="field">
              Defesa
              <input
                type="number"
                min="0"
                max="100"
                value={form.defesa}
                onChange={(event) => setForm((current) => ({ ...current, defesa: event.target.value }))}
              />
            </label>

            <label className="field">
              Pontos
              <input
                type="number"
                min="0"
                value={form.pontos}
                onChange={(event) => setForm((current) => ({ ...current, pontos: event.target.value }))}
              />
            </label>

            <label className="field">
              Cor
              <div className="swatches compact">
                {COLOR_SET.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`swatch ${form.cor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm((current) => ({ ...current, cor: color }))}
                    aria-label={`Selecionar cor ${color}`}
                  />
                ))}
              </div>
            </label>
          </div>

          <div className="inline-actions">
            <button className="button primary" type="submit">
              {editing ? 'Salvar alterações' : 'Adicionar time'}
            </button>
            {editing ? (
              <button className="button ghost" type="button" onClick={clearForm}>
                Cancelar edição
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="stack">
        {loading ? <div className="toast">Carregando times...</div> : null}
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} onEdit={handleEdit} onRemove={handleRemove} />
        ))}
        {!loading && teams.length === 0 ? <div className="toast">Nenhum time para o filtro escolhido.</div> : null}
      </div>
    </section>
  );
}
