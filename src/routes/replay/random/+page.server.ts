import type { PageServerLoad } from "./$types";
import { runGame } from "../../../lib/server/sim/v1sim.ts";

export const load: PageServerLoad = async () => {
  let homeTeam = "Amber";

  let awayTeam = "Beige";

  let gameReplay = runGame(homeTeam, awayTeam);

  return {
    game: gameReplay,
  };
};
