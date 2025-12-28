import { generateIntents } from "./teamLogic.ts";
import type { Player, Team, TeamIntentGenerator } from "./types.d.ts";

export function loadBlueTeam(
  team?: Team,
  players?: Player[]
): [Team, Player[], TeamIntentGenerator] {
  team = team || {
    id: 2,
    name: "Blue",
    color: "#0018A8",
    score: 0,
  };

  players = players?.filter((player) => player.teamId === team.id) || [
    {
      id: 4,
      teamId: 2,
      name: "Addie",
      x: 9,
      y: 3,
    },
    {
      id: 5,
      teamId: 2,
      name: "Nelli",
      x: 9,
      y: 4,
    },
    {
      id: 6,
      teamId: 2,
      name: "Penny",
      x: 9,
      y: 5,
    },
  ];

  return [team, players, generateIntents];
}
