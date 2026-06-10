import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { listChampionships } from "../services/championshipService";

export default function LoadingRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    async function checkChampionships() {
      try {
        const championships = await listChampionships();

        if (championships.length === 0) {
          navigate("/choose");
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error(error);
        navigate("/login");
      }
    }

    checkChampionships();
  }, []);

  return <h2>Carregando...</h2>;
}