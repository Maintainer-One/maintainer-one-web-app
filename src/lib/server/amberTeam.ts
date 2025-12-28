import { generateIntents } from "./teamLogic.ts";
import type { Player, Team, TeamIntentGenerator } from "./types.d.ts";

export function loadAmberTeam(
  team?: Team,
  players?: Player[]
): [Team, Player[], TeamIntentGenerator] {
  team = team || {
    id: 1,
    name: "Amber",
    color: "#FFBF00",
    score: 0,
  };

  players = players?.filter((player) => player.teamId === team.id) || [
    {
      id: 1,
      teamId: 1,
      name: "Bob",
      x: 0,
      y: 3,
    },
    {
      id: 2,
      teamId: 1,
      name: "Frank",
      x: 0,
      y: 4,
    },
    {
      id: 3,
      teamId: 1,
      name: "Ted",
      x: 0,
      y: 5,
    },
  ];

  return [team, players, generateIntents];
}
