export default function Project() {
  return (
    <section className="page-grid">
      <div className="panel">
        <h2>Proposta do projeto</h2>
        <p>
          O FinalScore foi ajustado para usar autenticação JWT, persistência em MySQL e geração de dados com Mockaroo no backend.
        </p>
      </div>

      <div className="content-grid two-cols">
        <article className="panel">
          <h3>Decisões técnicas</h3>
          <ul className="feature-list">
            <li>Frontend React consumindo API relativa em <code>/api</code></li>
            <li>Backend Express com rotas protegidas por JWT</li>
            <li>Seed automático de times e partidas persistido no banco</li>
          </ul>
        </article>

        <article className="panel">
          <h3>Comportamento esperado</h3>
          <p>
            O Dashboard filtra o campeonato e reflete os dados nas partidas, médias, gols totais e melhor time. Times e partidas podem ser editados diretamente na interface.
          </p>
        </article>
      </div>
    </section>
  );
}
