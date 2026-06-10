import { useEffect, useState } from "react";
import { listMatches } from "../services/matchService";

export default function useMatches(championshipFilter = "all") {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMatches(filter = championshipFilter) {
    try {
      setLoading(true);
      setError("");

      const data = await listMatches(filter);

      setMatches(data);
    } catch (err) {
      setError(
        err?.response?.data?.mensagem ||
        err.message ||
        "Erro ao carregar partidas"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (championshipFilter) {
      loadMatches();
    }
  }, [championshipFilter]);

  return {
    matches,
    loading,
    error,
    reload: loadMatches,
  };
}