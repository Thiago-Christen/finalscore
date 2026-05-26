import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(form.email, form.senha);
      navigate('/choose');
    } catch (err) {
      setError(err?.response?.data?.mensagem || err.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-grid">
      <div className="auth-copy panel">
        <span className="badge accent">Acesso ao projeto</span>
        <h1>Entre para continuar no FinalScore.</h1>
        <p>
          Os dados do usuário, campeonatos, times e partidas ficam no MySQL. O JWT libera o acesso à área protegida.
        </p>
        <Link to="/cadastro" className="button primary">Criar conta</Link>
      </div>

      <form className="auth-card panel" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <p>Entre com seus dados cadastrados.</p>

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
            placeholder="Sua senha"
            required
          />
        </label>

        {error ? <div className="toast error">{error}</div> : null}

        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="auth-footer">
          Não tem cadastro? <Link to="/cadastro">Criar conta</Link>
        </p>
      </form>
    </section>
  );
}
