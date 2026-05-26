import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StatCard from '../components/StatCard';
import MatchCard from '../components/MatchCard';
import { fetchDashboardSummary } from '../services/appService';

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
}

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({
    championships: [],
    selectedChampionship: null,
    teams: [],
    matches: [],
    standings: [],
    stats: { totalTimes: 0, totalPartidas: 0, partidasFinalizadas: 0, totalGols: 0, mediaGols: 0 },
    bestTeam: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const championshipId = searchParams.get('championshipId') || 'all';

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const summary = await fetchDashboardSummary(championshipId);
        if (active) {
          setData(summary);
        }
      } catch (err) {
        if (active) {
          setError(err?.response?.data?.mensagem || err.message || 'Não foi possível carregar o dashboard.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [championshipId]);


  function handleChampionshipChange(event) {
    const value = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete('championshipId');
    } else {
      next.set('championshipId', value);
    }
    setSearchParams(next);
  }

  return (
    <section className="page-grid">
      <div className="panel">
        <div className="section-header">
          <div>
            <h2>Dashboard</h2>
            <p>Filtre o campeonato para ver as partidas, médias, gols totais e o melhor time correspondente.</p>
          </div>

          <label className="field" style={{ minWidth: '240px' }}>
            Campeonato
            <select value={championshipId} onChange={handleChampionshipChange}>
              <option value="all">Todos os campeonatos</option>
              {data.championships.map((championship) => (
                <option key={championship.id} value={championship.id}>
                  {championship.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error ? <div className="toast error" style={{ marginTop: '16px' }}>{error}</div> : null}
        {loading ? <div className="toast" style={{ marginTop: '16px' }}>Carregando dados do banco...</div> : null}
      </div>

      <div className="stats-grid">
        <StatCard label="Times" value={formatNumber(data.stats.totalTimes)} hint="No filtro atual" />
        <StatCard label="Partidas" value={formatNumber(data.stats.totalPartidas)} hint="Total exibido" />
        <StatCard label="Finalizadas" value={formatNumber(data.stats.partidasFinalizadas)} hint="Com resultado" />
        <StatCard label="Gols totais" value={formatNumber(data.stats.totalGols)} hint={`Média ${Number(data.stats.mediaGols || 0).toFixed(2)}`} />
      </div>

      <div className="content-grid two-cols">
        <article className="panel">
          <h3>Melhor time</h3>
          {data.bestTeam ? (
            <>
              <p><strong>{data.bestTeam.nome}</strong></p>
              <p>
                {data.bestTeam.pontos} pontos • Saldo {data.bestTeam.saldo_gols} • {data.bestTeam.vitorias} vitórias
              </p>
            </>
          ) : (
            <p>Nenhum time encontrado para este filtro.</p>
          )}
        </article>

        <article className="panel">
          <h3>Campeonato selecionado</h3>
          {data.selectedChampionship ? (
            <>
              <p><strong>{data.selectedChampionship.nome}</strong></p>
              <p>{data.selectedChampionship.descricao}</p>
            </>
          ) : (
            <p>Todos os campeonatos estão sendo exibidos.</p>
          )}
        </article>
      </div>

      <div className="content-grid two-cols">
        <section>
          <div className="section-header">
            <h3>Partidas filtradas</h3>
            <span>{data.matches.length} partidas</span>
          </div>

          <div className="stack">
            {data.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
            {!loading && data.matches.length === 0 ? <div className="toast">Nenhuma partida cadastrada para este filtro.</div> : null}
          </div>
        </section>

        <section className="panel">
          <h3>Tabela do campeonato</h3>
          <div className="stack">
            {data.standings.map((team, index) => (
              <article key={team.id} className="toast">
                <strong>{index + 1}. {team.nome}</strong>
                <p>
                  {team.pontos} pts • {team.jogos} jogos • SG {team.saldo_gols} • GP {team.gols_pro} • GC {team.gols_contra}
                </p>
              </article>
            ))}
            {!loading && data.standings.length === 0 ? <div className="toast">A tabela aparece aqui depois do seed ou do cadastro manual.</div> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
