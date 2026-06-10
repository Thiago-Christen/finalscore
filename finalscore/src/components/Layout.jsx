import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logoutUser, getCurrentUser } from '../services/authService';

export default function Layout() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    logoutUser();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>FinalScore</h1>
          <p className="subtitle">
            {user?.nome ? `Bem-vindo, ${user.nome}` : 'Gerenciamento de campeonatos, times e partidas'}
          </p>
        </div>

        <div className="header-actions">
          <nav className="nav">
            <NavLink to="/" end className="nav-link">Dashboard</NavLink>
            <NavLink to="/campeonatos" className="nav-link">Campeonatos</NavLink>
            <NavLink to="/times" className="nav-link">Times</NavLink>
            <NavLink to="/partidas" className="nav-link">Partidas</NavLink>
            <NavLink to="/projeto" className="nav-link">Projeto</NavLink>
          </nav>
          <button className="button ghost" type="button" onClick={handleLogout}>Sair</button>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <span>FinalScore</span>
        <span>2026</span>
      </footer>
    </div>
  );
}
