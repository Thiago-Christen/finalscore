export default function TeamCard({ team, onEdit, onRemove }) {
  return (
    <article className="panel team-card">
      <div className="team-badge" style={{ backgroundColor: team.cor }} />
      <div className="team-info">
        <h3>{team.nome}</h3>
        <p>{team.cidade}</p>
      </div>

      <div className="team-meta">
        <span>Força {team.forca}</span>
        <span>Ataque {team.ataque}</span>
        <span>Defesa {team.defesa}</span>
        <span>Pontos {team.pontos}</span>
        <div className="inline-actions">
          {onEdit ? <button className="button small" type="button" onClick={() => onEdit(team)}>Editar</button> : null}
          {onRemove ? <button className="button small ghost" type="button" onClick={() => onRemove(team.id)}>Excluir</button> : null}
        </div>
      </div>
    </article>
  );
}
