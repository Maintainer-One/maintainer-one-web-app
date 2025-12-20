import type { PageServerLoad } from "./$types";
import { simGame } from "$lib/server/v1sim.ts";
import type { Team, Player } from "$lib/server/v1sim.ts";

export const load: PageServerLoad = async ({ params }) => {
  let teamA: Team = {
    name: "A's",
    players: [
      {
        name: "Bob",
      },
    ],
  };

  let teamB: Team = {
    name: "B's",
    players: [
      {
        name: "Anna",
      },
    ],
  };

  let gameReplay = simGame("123", teamA, teamB);

  return {
    game: gameReplay,
  };
};
