import { getShieldUrl } from '../utils/getShield';
export default function TeamCard({ team, onEdit, onRemove }) {
  return (
    <article className="panel team-card">
      <div className="team-info">
        <h3>{team.nome}</h3>
        <img
                  src={getShieldUrl(team.escudo)}
                  alt={team.nome}
                  width={32}
                  height={32}
                  style={{display: 'flex',marginRight: '8px', objectFit: 'contain', filter: team.escudo }}
                  onError={(e) => { e.target.src = '/backend/uploads/Escudo.png'; }}
                />
        <p>{team.cidade}</p>
      </div>

      <div className="team-meta">
        <span>Força {team.forca}</span>
        <span>Ataque {team.ataque}</span>
        <span>Defesa {team.defesa}</span>
        <div className="inline-actions">
          {onEdit ? <button className="button small" type="button" onClick={() => onEdit(team)}>Editar</button> : null}
          {onRemove ? <button className="button small ghost" type="button" onClick={() => onRemove(team.id)}>Excluir</button> : null}
        </div>
      </div>
    </article>
  );
}
