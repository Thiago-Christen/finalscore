import { useEffect, useState } from "react";
import { listTeams } from "../services/teamService";

export default function useTeams(championshipFilter = "all") {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTeams(filter = championshipFilter) {
    try {
      setLoading(true);
      setError("");

      const data = await listTeams(filter);

      setTeams(data);
    } catch (err) {
      setError(
        err?.response?.data?.mensagem ||
        err.message ||
        "Erro ao carregar times"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeams();
  }, [championshipFilter]);

  return {
    teams,
    loading,
    error,
    reload: loadTeams,
  };
}