import type { Team, TeamAction } from "./v1sim.ts";

export function randomMoveIntentGenerator(team: Team) {
  let teamAction: TeamAction = {
    name: team.name,
    color: team.color,
    players: team.players.map((player) => {
      return {
        name: player.name,
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
      };
    }),
  };
  return teamAction;
}
