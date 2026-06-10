import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import Alert from "../components/Alert";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', senha: '' });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.email.trim()) {
        setError('Informe o e-mail.');
        return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
        setError('Digite um e-mail válido.');
        return;
    }
    
    if (!form.senha.trim()) {
      setError('Informe a senha.');
      return;
    }

    setLoading(true);

    try {
      await loginUser(form.email, form.senha);
      navigate('/redirect');
    } catch (err) {
      setError(err?.response?.data?.mensagem || err.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-grid">
      <div className="auth-copy panel">
        <span className="badge accent">Login</span>
        <h1>Entre para continuar no FinalScore.</h1>
        <p>Caso você não tenha cadastro, crie uma nova conta abaixo.</p>
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
          />
        </label>

        <label className="field">
          Senha
          <input
            type="password"
            value={form.senha}
            onChange={(event) => setForm((current) => ({ ...current, senha: event.target.value }))}
            placeholder="Sua senha"
          />
        </label>

        <Alert type="error">{error}</Alert>

        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </section>
  );
}
