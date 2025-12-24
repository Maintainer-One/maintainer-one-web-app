import type { PageServerLoad } from "./$types";
import { simGame } from "$lib/server/v1sim.ts";
import type { Team } from "$lib/server/v1sim.ts";

export const load: PageServerLoad = async () => {
  let teamA: Team = {
    name: "The Amber Team",
    color: "#FFBF00",
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
    name: "The Blue Team",
    color: "#0018A8",
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
