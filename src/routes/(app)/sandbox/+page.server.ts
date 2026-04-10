import type { PageServerLoad } from "./$types";
import { runGame } from "$lib/sim/v1sim";

export const load: PageServerLoad = async ({ locals }) => {
  // We'll use Amber and Beige as defaults
  const homeTeam = 'Amber';
  const awayTeam = 'Beige';

  const gameReplay = await runGame(homeTeam, awayTeam);

  return {
    game: gameReplay,
    defaultTeams: ['Amber', 'Beige', 'Crimson', 'Denim']
  };
};
