import { generateIntents } from "./teamLogic.ts";
import type { Player, Team, TeamIntentGenerator } from "./types.d.ts";

export function loadBeigeTeam(
  team?: Team,
  players?: Player[]
): [Team, Player[], TeamIntentGenerator] {
  team = team || {
    id: 2,
    name: "Beige",
    color: "#F5F5DC",
    score: 0,
  };

  players = players?.filter((player) => player.teamId === team.id) || [
    {
      id: 4,
      teamId: 2,
      name: "Bonnie",
      x: 9,
      y: 3,
    },
    {
      id: 5,
      teamId: 2,
      name: "Brad",
      x: 9,
      y: 4,
    },
    {
      id: 6,
      teamId: 2,
      name: "Bluth",
      x: 9,
      y: 5,
    },
  ];

  return [team, players, generateIntents];
}
