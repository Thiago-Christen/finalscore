import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addChampionship, deleteChampionship, generateSeedForChampionship, listChampionships, updateChampionship } from '../services/championshipService';

export default function Championships() {
  const [searchParams, setSearchParams] = useSearchParams();
  const seedFromQuery = searchParams.get('seed') === '1';

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    generateSeed: seedFromQuery,
  });
  const [championships, setChampionships] = useState([]);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadChampionships() {
    setLoading(true);
    try {
      const data = await listChampionships();
      setChampionships(data);
    } catch (err) {
      setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível carregar os campeonatos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setForm((current) => ({ ...current, generateSeed: seedFromQuery }));
  }, [seedFromQuery]);

  useEffect(() => {
    loadChampionships();
  }, []);

  function clearForm() {
    setForm({ nome: '', descricao: '', generateSeed: seedFromQuery });
    setEditing(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setSaving(true);

    try {
      if (editing) {
        await updateChampionship(editing.id, {
          nome: form.nome,
          descricao: form.descricao,
        });
        setMessage('Campeonato atualizado com sucesso.');
      } else {
        const created = await addChampionship({
          nome: form.nome,
          descricao: form.descricao,
          generateSeed: form.generateSeed,
        });

        if (form.generateSeed) {
          setMessage('Campeonato criado e populado com dados aleatórios.');
        } else {
          setMessage('Campeonato criado sem seed inicial.');
        }

        if (created?.gerado) {
          setMessage('Campeonato criado e persistido com seed via Mockaroo.');
        }
      }

      clearForm();
      await loadChampionships();
      setSearchParams({});
    } catch (err) {
      setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível salvar o campeonato.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    try {
      await deleteChampionship(id);
      setMessage('Campeonato removido.');
      await loadChampionships();
    } catch (err) {
      setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível excluir o campeonato.');
    }
  }

  async function handleSeed(id) {
    try {
      await generateSeedForChampionship(id);
      setMessage('Seed gerado e salvo no banco.');
      await loadChampionships();
    } catch (err) {
      setMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível gerar o seed.');
    }
  }

  function handleEdit(championship) {
    setEditing(championship);
    setForm({
      nome: championship.nome,
      descricao: championship.descricao,
      generateSeed: false,
    });
  }

  return (
    <section className="page-grid">
      {message ? <div className="toast">{message}</div> : null}

      <div className="panel">
        <h2>{editing ? 'Editar campeonato' : 'Criar campeonato'}</h2>
        <p>O botão de seed gera o JSON aleatório no backend e grava times e partidas diretamente no MySQL.</p>

        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid two-cols">
            <label className="field">
              Nome
              <input
                value={form.nome}
                onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                placeholder="Ex.: FinalScore Cup 2026"
                required
              />
            </label>
            <label className="field">
              Descrição
              <input
                value={form.descricao}
                onChange={(event) => setForm((current) => ({ ...current, descricao: event.target.value }))}
                placeholder="Ex.: Temporada principal"
                required
              />
            </label>
          </div>

          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={form.generateSeed}
              onChange={(event) => setForm((current) => ({ ...current, generateSeed: event.target.checked }))}
            />
            Gerar times e partidas automaticamente via Mockaroo
          </label>

          <div className="inline-actions">
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar campeonato'}
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
        {loading ? <div className="toast">Carregando campeonatos...</div> : null}

        {championships.map((championship) => (
          <article key={championship.id} className="panel">
            <div className="section-header">
              <div>
                <h3>{championship.nome}</h3>
                <p>{championship.descricao}</p>
              </div>
              <div className="inline-actions">
                <button className="button small" type="button" onClick={() => handleEdit(championship)}>Editar</button>
                <button className="button small ghost" type="button" onClick={() => handleSeed(championship.id)}>Gerar seed</button>
                <button className="button small ghost" type="button" onClick={() => handleRemove(championship.id)}>Excluir</button>
              </div>
            </div>
          </article>
        ))}

        {!loading && championships.length === 0 ? <div className="toast">Nenhum campeonato cadastrado ainda.</div> : null}
      </div>
    </section>
  );
}
