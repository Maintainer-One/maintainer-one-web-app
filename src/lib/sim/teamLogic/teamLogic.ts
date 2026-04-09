import type { Intent, Player, PointZone, Team } from '../utils/types.d.ts';

export function generateIntents(
  team: Team,
  opponent: Team,
  players: Player[],
  pointZones: PointZone[],
) {
  const intents: Intent[] = [];
  const crimsonPlayers = players.filter((player) => player.teamId === team.id);

  if (pointZones.length === 0) {
    return intents;
  }

  const closestPlayer: {
    distance?: number;
    player?: Player;
  } = {};

  for (const player of crimsonPlayers) {
    const distance = Math.abs(player.x - pointZones[0].x) + Math.abs(player.y - pointZones[0].y);

    if (closestPlayer.distance === undefined || closestPlayer.distance > distance) {
      closestPlayer.distance = distance;
      closestPlayer.player = player;
    }
  }

  if (closestPlayer.player !== undefined) {
    const player = closestPlayer.player;
    const pointZone = pointZones[0];

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
