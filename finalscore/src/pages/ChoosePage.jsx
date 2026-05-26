import { useNavigate } from 'react-router-dom';
import './ChoosePage.css';

export default function ChoosePage() {
  const navigate = useNavigate();

  function handlePopular() {
    navigate('/campeonatos?seed=1');
  }

  function handleEmpty() {
    navigate('/campeonatos?seed=0');
  }

  return (
    <div className="choose-container">
      <div className="choose-content">
        <div className="choose-header">
          <span className="choose-tag">Novo Campeonato</span>
          <h1>
            Como deseja criar seu
            <span> campeonato</span>?
          </h1>
          <p>
            Escolha entre iniciar com times e partidas gerados automaticamente ou criar uma estrutura limpa.
          </p>
        </div>

        <div className="choose-cards">
          <div className="choose-card">
            <div className="card-icon">⚡</div>
            <h2>Campeonato Povoado</h2>
            <p>Times e partidas são gerados com Mockaroo e gravados no banco.</p>
            <ul>
              <li>Times automáticos</li>
              <li>Partidas aleatórias</li>
              <li>Dados persistidos no MySQL</li>
              <li>Ideal para testes</li>
            </ul>
            <button onClick={handlePopular}>Criar Automático</button>
          </div>

          <div className="choose-card">
            <div className="card-icon">🛠️</div>
            <h2>Campeonato Zerado</h2>
            <p>Crie o campeonato manualmente e depois cadastre os times e partidas.</p>
            <ul>
              <li>Times personalizados</li>
              <li>Controle total</li>
              <li>Estrutura limpa</li>
              <li>Modo profissional</li>
            </ul>
            <button onClick={handleEmpty}>Criar do Zero</button>
          </div>
        </div>
      </div>
    </div>
  );
}
