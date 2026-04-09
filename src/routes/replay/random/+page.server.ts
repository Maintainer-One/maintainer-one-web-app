import type { PageServerLoad, Actions } from "./$types";
import { runGame } from "../../../lib/server/sim/v1sim.ts";

export const load: PageServerLoad = async () => {
  let homeTeam = "Amber";
  let awayTeam = "Beige";

  let gameReplay = await runGame(homeTeam, awayTeam);

  return {
    game: gameReplay,
  };
};

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const homeCode = formData.get("homeCode")?.toString();
    const awayCode = formData.get("awayCode")?.toString();
    const homeTeam = "Amber";
    const awayTeam = "Beige";

    const gameReplay = await runGame(homeTeam, awayTeam, homeCode, awayCode);

    return {
      game: gameReplay,
      homeCode,
      awayCode
    };
  }
};
