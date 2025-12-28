import type { PageServerLoad } from "./$types";
import { runGame } from "$lib/server/v1sim.ts";

export const load: PageServerLoad = async () => {
  let homeTeam = "Amber";

  let awayTeam = "Crimson";

  let gameReplay = runGame(homeTeam, awayTeam);

  return {
    game: gameReplay,
  };
};
