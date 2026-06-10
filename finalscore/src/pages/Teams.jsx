import { useEffect,  useState } from 'react';
import TeamCard from '../components/TeamCard';
import { addTeam, deleteTeam, updateTeam } from '../services/teamService';
import { listChampionships } from '../services/championshipService';
import useTeams from "../hooks/useTeam";
import useChampionships from "../hooks/useChampionship";
import useForm from "../hooks/useForm";

const COLOR_SET = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#A855F7', '#14B8A6'];

export default function Teams() {
  const [championshipFilter, setChampionshipFilter] = useState('all');
  const {championships,loading: championshipsLoading,error: championshipsError} = useChampionships();
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const {teams,loading,error,reload: loadTeams} = useTeams(championshipFilter);
  const {
  form,
  setForm,
  handleChange,
  reset,
} = useForm({
  campeonato_id: '',
  nome: '',
  cidade: '',
  cor: COLOR_SET[0],
  forca: 80,
  ataque: 80,
  defesa: 80,
  pontos: 0,
});

  useEffect(() => {
  if (
    championships.length > 0 &&
    !form.campeonato_id
  ) {
    setForm((current) => ({
      ...current,
      campeonato_id: String(championships[0].id),
    }));

    if (championshipFilter === "all") {
      setChampionshipFilter(String(championships[0].id));
    }
  }
}, [championships]);

  function clearForm() {
  reset({
    campeonato_id:
      championshipFilter === 'all'
        ? String(championships[0]?.id || '')
        : championshipFilter,
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
            <h2>Times</h2>
            <p>Edite os times cadastrados no banco e filtre pelo campeonato desejado.</p>
          </div>

          <label className="field" style={{ minWidth: '240px' }}>
            Campeonato
            <select name="campeonato_id" value={championshipFilter}
              onChange={(e) => setChampionshipFilter(e.target.value)}
            >
              <option value="all">Todos os campeonatos</option>
              {championships.map((championship) => (
                <option key={championship.id} value={championship.id}>
                  {championship.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <div className="toast" style={{ marginTop: '16px' }}>
            {error}
          </div>
        )}
        {message ? <div className="toast" style={{ marginTop: '16px' }}>{message}</div> : null}

        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid two-cols">
            <label className="field">
              Campeonato
              <select
                name="campeonato_id"
                value={form.campeonato_id}
                onChange={handleChange}
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
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <div className="form-grid three-cols">
            <label className="field">
              Cidade
              <input
                name="cidade"
                value={form.cidade}
                onChange={handleChange}
                required
              />
            </label>
            <label className="field">
              Força
              <input
                type="number"
                min="0"
                max="100"
                name="ataque"
                value={form.ataque}
                onChange={handleChange}
              />
            </label>
            <label className="field">
              Ataque
              <input
                type="number"
                min="0"
                max="100"
                name="ataque"
                value={form.ataque}
                onChange={handleChange}
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
                name="defesa"
                value={form.defesa}
                onChange={handleChange}
              />
            </label>

            <label className="field">
              Pontos
              <input
                type="number"
                min="0"
                name="pontos"
                value={form.pontos}
                onChange={handleChange}
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
