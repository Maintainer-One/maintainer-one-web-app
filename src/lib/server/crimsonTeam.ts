import type {
  Intent,
  Player,
  PointZone,
  Team,
  TeamIntentGenerator,
} from "./types.d.ts";

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
      y: 8,
    },
  ];

  return [team, players, generateIntents];
}

function generateIntents(
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

// function generateIntents(team: Team, opponent: Team, players: Player[]) {
//   let intents: Intent[] = [];
//   let currentPlayers = players.filter((player) => player.teamId === team.id);

//   for (let player of currentPlayers) {
//     let targetX = team.status === "Home" ? player.x + 1 : player.x - 1;
//     let targetY = player.y;

//     if (player.x === 5 && player.y === 1) {
//       targetX = player.x;
//       targetY = player.y + 1;
//     } else if (player.x === 5 && player.y === 8) {
//       targetX = player.x;
//       targetY = player.y - 1;
//     }

//     intents.push({
//       playerId: player.id,
//       x: targetX,
//       y: targetY,
//     });
//   }

//   return intents;
// }
