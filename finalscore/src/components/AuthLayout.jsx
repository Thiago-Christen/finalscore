import { Link, Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <header className="auth-topbar">
        <Link to="/login" className="brand-link">FinalScore</Link>
        <nav className="auth-nav">
          <Link to="/login">Entrar</Link>
          <Link to="/cadastro">Criar conta</Link>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
