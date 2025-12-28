import { generateIntents } from "./teamLogic.ts";
import type { Player, Team, TeamIntentGenerator } from "./types.d.ts";

export function loadCrimsonTeam(
  team?: Team,
  players?: Player[]
): [Team, Player[], TeamIntentGenerator] {
  team = team || {
    id: 3,
    name: "Crimson",
    color: "#DC143C",
    score: 0,
  };

  players = players?.filter((player) => player.teamId === team.id) || [
    {
      id: 7,
      teamId: 3,
      name: "Corie",
      x: -1,
      y: 1,
    },
    {
      id: 8,
      teamId: 3,
      name: "Calin",
      x: -1,
      y: 4,
    },
    {
      id: 9,
      teamId: 3,
      name: "Chad",
      x: -1,
      y: 7,
    },
  ];

  return [team, players, generateIntents];
}
