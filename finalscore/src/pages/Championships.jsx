import { useEffect, useState } from 'react';
import useChampionships from '../hooks/useChampionship';
import { useSearchParams } from 'react-router-dom';
import { addChampionship, deleteChampionship, generateSeedForChampionship, updateChampionship } from '../services/championshipService';
import useForm from "../hooks/useForm";
import useMessageAndEditing from '../hooks/useMessageAndEditting';

export default function Championships() {
  const [searchParams, setSearchParams] = useSearchParams();
  const seedFromQuery = searchParams.get('seed') === '1';
  const {form,setForm,handleChange,reset} = useForm({nome: '',descricao: '',generateSeed: seedFromQuery,});
  const [saving, setSaving] = useState(false);
  const {message,showMessage,editing,setEditing,stopEditing} = useMessageAndEditing();

  const {championships,loading,error,reload: loadChampionships} = useChampionships();

  useEffect(() => {
    setForm((current) => ({ ...current, generateSeed: seedFromQuery }));
  }, [seedFromQuery]);


  function clearForm() {
  reset({
    nome: '',
    descricao: '',
    generateSeed: seedFromQuery,
  });

  stopEditing();
}

  async function handleSubmit(event) {
    event.preventDefault();
    showMessage('');
    setSaving(true);

    try {
      if (editing) {
        await updateChampionship(editing.id, {
          nome: form.nome,
          descricao: form.descricao,
        });
        showMessage('Campeonato atualizado com sucesso.');
      } else {
        const created = await addChampionship({
          nome: form.nome,
          descricao: form.descricao,
          generateSeed: form.generateSeed,
        });

        if (form.generateSeed) {
          showMessage('Campeonato criado e populado com dados aleatórios.');
        } else {
          showMessage('Campeonato criado sem seed inicial.');
        }

        if (created?.gerado) {
          showMessage('Campeonato criado.');
        }
      }

      clearForm();
      await loadChampionships();
      setSearchParams({});
    } catch (err) {
      showMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível salvar o campeonato.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    try {
      await deleteChampionship(id);
      showMessage('Campeonato removido.');
      await loadChampionships();
    } catch (err) {
      showMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível excluir o campeonato.');
    }
  }

  async function handleSeed(id) {
    try {
      await generateSeedForChampionship(id);
      showMessage('Seed gerado e salvo no banco.');
      await loadChampionships();
    } catch (err) {
      showMessage(err?.response?.data?.mensagem || err.message || 'Não foi possível gerar o seed.');
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
      {error ? <div className="toast">{error}</div> : null}

      <div className="panel">
        <h2>{editing ? 'Editar campeonato' : 'Criar campeonato'}</h2>
        <p>O botão de seed gera aleatóriamente times e partidas e grava diretamente no banco de dados.</p>

        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid two-cols">
            <label className="field">
              Nome
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Ex.: FinalScore Cup 2026"
                
              />
            </label>
            <label className="field">
              Descrição
              <input
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                placeholder="Ex.: Temporada principal"
                
              />
            </label>
          </div>

          <label className="field checkbox-field">
            <input
              type="checkbox"
              name="generateSeed"
              checked={form.generateSeed}
              onChange={handleChange}
            />
            Gerar times e partidas automaticamente.
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
