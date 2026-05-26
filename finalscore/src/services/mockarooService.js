import { generateSeedForChampionship } from './championshipService';

export async function generateSeedData(championshipId) {
  return generateSeedForChampionship(championshipId);
}
