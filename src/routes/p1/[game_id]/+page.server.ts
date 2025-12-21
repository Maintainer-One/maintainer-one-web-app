import type { PageServerLoad } from "./$types";
import { simGame } from "$lib/server/v1sim.ts";
import type { Team } from "$lib/server/v1sim.ts";

export const load: PageServerLoad = async ({ params }) => {
  let teamA: Team = {
    name: "A's",
    players: [
      {
        name: "Bob",
      },
      {
        name: "Frank",
      },
      {
        name: "Ted",
      },
    ],
  };

  let teamB: Team = {
    name: "B's",
    players: [
      {
        name: "Addie",
      },
      {
        name: "Nelli",
      },
      {
        name: "Penny",
      },
    ],
  };

  let gameReplay = simGame("123", [teamA, teamB]);

  return {
    game: gameReplay,
  };
};
