import { useEffect,  useState } from 'react';
import TeamCard from '../components/TeamCard';
import { addTeam, deleteTeam, updateTeam } from '../services/teamService';
import { listChampionships } from '../services/championshipService';
import useTeams from "../hooks/useTeam";
import useChampionships from "../hooks/useChampionship";
import useForm from "../hooks/useForm";
import useMessageAndEditing from "../hooks/useMessageAndEditting";
import {getShieldUrl} from "../utils/getShield";


export default function Teams() {
  const [championshipFilter, setChampionshipFilter] = useState('all');
  const {championships,loading: championshipsLoading,error: championshipsError} = useChampionships();
  const {teams,loading,error,reload: loadTeams} = useTeams(championshipFilter);
  const {form,setForm,handleChange,reset,} = useForm({campeonato_id: '',nome: '',cidade: '',estadio:'',escudo:null,forca: 80,ataque: 80,defesa: 80,});
  const {message,setMessage,editing,setEditing,showMessage,stopEditing} = useMessageAndEditing();

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
    estadio:'',
    forca: 80,
    ataque: 80,
    defesa: 80,
  });

  stopEditing();
}

  async function handleSubmit(event) {
    event.preventDefault();

    console.log("FORM ENVIADO:", form);

    showMessage('');

    try {
      const payload = new FormData();

      payload.append('campeonato_id', form.campeonato_id);
      payload.append('nome', form.nome);
      payload.append('cidade', form.cidade);
      payload.append('estadio', form.estadio);
      payload.append('forca', form.forca);
      payload.append('ataque', form.ataque);
      payload.append('defesa', form.defesa);

      if (form.escudo instanceof File) {
        payload.append("escudo", form.escudo);
      }

      if (editing) {
        await updateTeam(editing.id, payload);
        showMessage('Time atualizado com sucesso.');
      } else {
        await addTeam(payload);
        showMessage('Time criado com sucesso.');
      }

      clearForm();
      await loadTeams(championshipFilter);
    } catch (err) {
      showMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível salvar o time.');
    }

    window.scrollTo({
      top: 14,
      behavior: 'smooth',
    });
  }

  async function handleRemove(id) {
    try {
      await deleteTeam(id);
      showMessage('Time excluído.');
      await loadTeams(championshipFilter);
    } catch (err) {
      showMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível excluir o time.');
    }
  }

  function handleEdit(team) {
    setEditing(team);
    setForm({
        campeonato_id: String(team.campeonato_id),
        nome: team.nome,
        cidade: team.cidade,
        estadio: team.estadio,
        forca: team.forca,
        ataque: team.ataque,
        defesa: team.defesa,

        escudo: team.escudo || null,
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
          <div className="toast error" style={{ marginTop: '16px' }}>
            {error}
          </div>
        )}
        {message && (
          <div className="toast success" style={{ marginTop: '16px' }}>
            {message}
          </div>
        )}

        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid two-cols">
            <label className="field">
              Campeonato
              <select
                name="campeonato_id"
                value={form.campeonato_id}
                onChange={handleChange}
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
              />
            </label>
          </div>

          <div className="form-grid tree-cols">
            <label className="field">
              Cidade
              <input
                name="cidade"
                value={form.cidade}
                onChange={handleChange}
              />
            </label>
            <label className="field">
              Estádio
              <input
                name="estadio"
                value={form.estadio}
                onChange={handleChange}
              />
            </label>
            Escudo
            <label className="upload-dropzone">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    escudo: e.target.files[0],
                  }))
                }
              />
              {form.escudo ? (
                <>
                  <img
                    src={getShieldUrl(form.escudo)}
                    alt="Prévia do escudo"
                    className="shield-preview"
                  />

                  <strong>{form.escudo.name}</strong>
                  <p>Clique para trocar a imagem</p>
                </>
              ) : (
                <>
                  <strong>Clique para enviar um escudo</strong>
                  <p>PNG, JPG ou SVG</p>
                </>
              )}
            </label>
          </div>

          <div className="form-grid four-cols">
            <label className="field">
              Força
              <input
                type="number"
                min="0"
                max="100"
                name="forca"
                value={form.forca}
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
