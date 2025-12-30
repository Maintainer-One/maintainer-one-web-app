import type { Intent, Player, PointZone, Team } from "./types.d.ts";

export function generateIntents(
  team: Team,
  opponent: Team,
  players: Player[],
  pointZones: PointZone[]
) {
  let intents: Intent[] = [];
  let crimsonPlayers = players.filter((player) => player.teamId === team.id);

  if (pointZones.length === 0) {
    return intents;
  }

  let closestPlayer: {
    distance?: number;
    player?: Player;
  } = {};

  for (let player of crimsonPlayers) {
    let distance =
      Math.abs(player.x - pointZones[0].x) +
      Math.abs(player.y - pointZones[0].y);

    if (
      closestPlayer.distance === undefined ||
      closestPlayer.distance > distance
    ) {
      closestPlayer.distance = distance;
      closestPlayer.player = player;
    }
  }

  if (closestPlayer.player !== undefined) {
    let player = closestPlayer.player;
    let pointZone = pointZones[0];

    let targetX = player.x;
    let targetY = player.y;

    if (pointZone.x > player.x) {
      targetX += 1;
    } else if (pointZone.x < player.x) {
      targetX -= 1;
    } else if (pointZone.y > player.y) {
      targetY += 1;
    } else if (pointZone.y < player.y) {
      targetY -= 1;
    }

    intents.push({
      playerId: player.id,
      x: targetX,
      y: targetY,
    });
  }

  return intents;
}
