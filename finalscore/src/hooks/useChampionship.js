import { useEffect, useState } from "react";
import { listChampionships } from "../services/championshipService";

export default function useChampionships() {
  const [championships, setChampionships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadChampionships() {
    try {
      setLoading(true);
      setError("");

      const data = await listChampionships();

      setChampionships(data);
    } catch (err) {
      setError(
        err?.response?.data?.mensagem ||
        err.message ||
        "Erro ao carregar campeonatos"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChampionships();
  }, []);

  return {
    championships,
    loading,
    error,
    reload: loadChampionships,
  };
}