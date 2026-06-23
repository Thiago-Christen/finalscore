import { formatDate } from '../utils/competition';
import { getShieldUrl } from '../utils/getShield';

export default function MatchCard({ match, onEdit, onRemove }) {
  return (
    <article className="panel match-card">
      <div>
        <span className="badge">Rodada {match.rodada}</span>

        <div className="teams-row">
          <div className="team">
            <img
              src={getShieldUrl(match.time_mandante_escudo)}
              alt={match.time_mandante_nome}
              width={28}
              height={28}
              style={{ objectFit: 'contain' }}
              onError={(e) => {
                e.target.src = '/backend/uploads/Escudo.png';
              }}
            />
            <span>{match.time_mandante_nome}</span>
          </div>

          <span className="vs">x</span>

          <div className="team">
            <img
              src={getShieldUrl(match.time_visitante_escudo)}
              alt={match.time_visitante_nome}
              width={28}
              height={28}
              style={{ objectFit: 'contain' }}
              onError={(e) => {
                e.target.src = '/backend/uploads/Escudo.png';
              }}
            />
            <span>{match.time_visitante_nome}</span>
          </div>
        </div>

        <p>
          {match.status === 'finalizada'
            ? `Finalizada em ${formatDate(match.data_partida)} • ${match.local}`
            : `Agendada para ${formatDate(match.data_partida)} • ${match.local}`}
        </p>
      </div>

      <div className="score-box">
        <strong>
          {match.status === 'finalizada' ? match.resultado : 'Agendada'}
        </strong>
        <small>{match.status}</small>

        <div className="inline-actions">
          {onEdit ? (
            <button
              className="button small"
              type="button"
              onClick={() => onEdit(match)}
            >
              Editar
            </button>
          ) : null}

          {onRemove ? (
            <button
              className="button small ghost"
              type="button"
              onClick={() => onRemove(match.id)}
            >
              Excluir
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}