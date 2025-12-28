import type { Intent, Player, Team } from "./types.d.ts";

export function generateIntents(team: Team, opponent: Team, players: Player[]) {
  let intents: Intent[] = [];
  let currentPlayers = players.filter((player) => player.teamId === team.id);

  for (let player of currentPlayers) {
    intents.push({
      playerId: player.id,
      x: team.status === "Home" ? player.x + 1 : player.x - 1,
      y: player.y,
    });
  }
  return intents;
}
