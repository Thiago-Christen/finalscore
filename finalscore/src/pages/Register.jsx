import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerUser(form);
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.mensagem || err.message || 'Não foi possível criar sua conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-grid">
      <div className="auth-copy panel">
        <span className="badge accent">Cadastro do usuário</span>
        <h1>Crie sua conta para acessar os campeonatos.</h1>
        <p>
          O cadastro grava o usuário no banco. Depois do login você escolhe entre criar um campeonato vazio ou gerar times e partidas com Mockaroo.
        </p>
      </div>

      <form className="auth-card panel" onSubmit={handleSubmit}>
        <h2>Cadastro</h2>
        <p>Complete os dados para liberar o acesso.</p>

        <label className="field">
          Nome
          <input
            value={form.nome}
            onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
            placeholder="Seu nome"
            required
          />
        </label>

        <label className="field">
          E-mail
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="voce@exemplo.com"
            required
          />
        </label>

        <label className="field">
          Senha
          <input
            type="password"
            value={form.senha}
            onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
            placeholder="Crie sua senha"
            required
          />
        </label>

        {error ? <div className="toast error">{error}</div> : null}

        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Criando...' : 'Criar conta'}
        </button>

        <p className="auth-footer">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </section>
  );
}
