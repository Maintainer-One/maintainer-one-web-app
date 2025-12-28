import { generateIntents } from "./teamLogic.ts";
import type { Player, Team, TeamIntentGenerator } from "./types.d.ts";

export function loadDenimTeam(
  team?: Team,
  players?: Player[]
): [Team, Player[], TeamIntentGenerator] {
  team = team || {
    id: 4,
    name: "Denim",
    color: "#1560BD",
    score: 0,
  };

  players = players?.filter((player) => player.teamId === team.id) || [
    {
      id: 10,
      teamId: 4,
      name: "Derick",
      x: 9,
      y: 3,
    },
    {
      id: 11,
      teamId: 4,
      name: "Drayson",
      x: 9,
      y: 4,
    },
    {
      id: 12,
      teamId: 4,
      name: "Danny",
      x: 9,
      y: 5,
    },
  ];

  return [team, players, generateIntents];
}
