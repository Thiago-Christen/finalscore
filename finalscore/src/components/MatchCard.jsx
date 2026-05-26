import { formatDate } from '../utils/competition';

export default function MatchCard({ match, onEdit, onRemove }) {
  return (
    <article className="panel match-card">
      <div>
        <span className="badge">Rodada {match.rodada}</span>
        <h3>
          {match.time_mandante_nome} <span>x</span> {match.time_visitante_nome}
        </h3>
        <p>
          {match.status === 'finalizada'
            ? `Finalizada em ${formatDate(match.data_partida)} • ${match.local}`
            : `Agendada para ${formatDate(match.data_partida)} • ${match.local}`}
        </p>
      </div>

      <div className="score-box">
        <strong>{match.status === 'finalizada' ? match.resultado : 'Agendada'}</strong>
        <small>{match.status}</small>
        <div className="inline-actions">
          {onEdit ? <button className="button small" type="button" onClick={() => onEdit(match)}>Editar</button> : null}
          {onRemove ? <button className="button small ghost" type="button" onClick={() => onRemove(match.id)}>Excluir</button> : null}
        </div>
      </div>
    </article>
  );
}
