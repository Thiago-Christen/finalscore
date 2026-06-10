import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import Alert from '../components/Alert';

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

    if(!form.nome.trim()) {
      setError('Informe seu nome');
      return;
    }

    if (!form.email.trim()) {
        setError('Informe o e-mail.');
        return;
        }
    
    if (!form.senha.trim()) {
      setError('Informe a senha.');
      return;
    }
    
    if (form.senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

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
        <p>Seja bem-vindo ao FinalScore!!</p>
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
          />
        </label>

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
            placeholder="Crie sua senha"
          />
        </label>

        <Alert type="error">{error}</Alert>

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
