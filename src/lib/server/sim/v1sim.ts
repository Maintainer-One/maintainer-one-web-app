import { loadBeigeTeam } from "../teamLogic/beigeTeam.ts";
import { loadAmberTeam } from "../teamLogic/amberTeam.ts";
import { loadCrimsonTeam } from "../teamLogic/crimsonTeam.ts";
import { loadDenimTeam } from "../teamLogic/denimTeam.ts";
import type {
  Player,
  PointZone,
  Replay,
  TeamLoadFunction,
  Tick,
} from "./utils/types";
import { MatchPCG } from "./utils/random.ts";

let teamMap: Record<string, TeamLoadFunction> = {
  Amber: loadAmberTeam,
  Beige: loadBeigeTeam,
  Crimson: loadCrimsonTeam,
  Denim: loadDenimTeam,
};

const GAME_LENGTH = 100;
const POINT_ZONE_CAPTURE_COOL_DOWN = 3;

export function runGame(homeTeamName: string, awayTeamName: string): Replay {
  let [homeTeam, homePlayers, homeIntentGenerator] = teamMap[homeTeamName]();
  let [awayTeam, awayPlayers, awayIntentGenerator] = teamMap[awayTeamName]();

  let seed = BigInt(Math.floor(Math.random() * 10000000));

  // console.log({ seed });

  // let prng = new MatchPCG(5637502n);
  let prng = new MatchPCG(seed);

  homeTeam.status = "Home";
  awayTeam.status = "Away";

  for (let player of homePlayers) {
    player.x = 0;
  }

  for (let player of awayPlayers) {
    player.x = 9;
  }

  let players: Player[] = [...homePlayers, ...awayPlayers];

  let gameReplay: Replay = {
    ticks: [
      {
        homeTeam: { ...homeTeam },
        awayTeam: { ...awayTeam },
        players: players.map((player) => {
          return { ...player };
        }),
        pointZones: [],
      },
    ],
  };

  // With a cool down of 4, the first point zone will appear on game tick 5
  let pointZoneCoolDown = 4;
  let pointZones: PointZone[] = [];

  for (let tickCount = 0; tickCount < GAME_LENGTH - 1; tickCount++) {
    let tick: Tick = {
      homeTeam: { ...homeTeam },
      awayTeam: { ...awayTeam },
      players: [],
      pointZones: [],
    };

    // POINT ZONE LOGIC
    if (pointZoneCoolDown === 0) {
      let x = prng.nextRange(0, 9);
      let y = prng.nextRange(0, 9);

      pointZones.push({
        x,
        y,
      });
      pointZoneCoolDown = -1;
    } else if (pointZoneCoolDown > 0) {
      pointZoneCoolDown--;
    }

    // PLAYER INTENT LOGIC
    let intents = [
      ...homeIntentGenerator(homeTeam, awayTeam, players, pointZones),
      ...awayIntentGenerator(awayTeam, homeTeam, players, pointZones),
    ];

    let occupied: Record<string, Player> = {};

    for (let player of players) {
      occupied[`${player.x},${player.y}`] = player;
    }

    let collisions: Record<string, Player[]> = {};

    for (let player of players) {
      let intent = intents.find((intent) => player.id === intent.playerId);

      if (intent === undefined) {
        continue;
      }

      // Ignore intent if out of bounds
      if (intent.x > 9 || intent.y > 9 || intent.x < 0 || intent.y < 0) {
        continue;
      }
      // If trying to move to an occupied square
      if (occupied[`${intent.x},${intent.y}`]) {
        // Add a collision if there isn't one, otherwise add a player to the collision
        if (collisions[`${intent.x},${intent.y}`]) {
          collisions[`${intent.x},${intent.y}`].push(player);
        } else {
          collisions[`${intent.x},${intent.y}`] = [
            occupied[`${intent.x},${intent.y}`],
            player,
          ];
        }
      }

      player.targetX = intent.x;
      player.targetY = intent.y;
      occupied[`${intent.x},${intent.y}`] = player;
    }

    for (let [key, collidingPlayers] of Object.entries(collisions)) {
      let [stringX, stringY] = key.split(",");
      let x = parseInt(stringX);
      let y = parseInt(stringY);
      let occupier: Player | undefined = collidingPlayers[0];

      if (
        tickCount === 17 &&
        collidingPlayers.length === 2 &&
        occupier.targetX !== undefined
      ) {
        continue;
      }

      for (let player of collidingPlayers) {
        if (occupier === undefined) {
          occupier = player;
        } else if (occupier.targetX !== x || occupier.targetY !== y) {
          occupier = undefined;
        } else if (occupier.id !== player.id) {
          delete occupier.targetX;
          delete occupier.targetY;
          delete player.targetX;
          delete player.targetY;
        }
      }
    }

    // If any players are on the current point zone we increment score and remove the point zone
    for (let [index, pointZone] of pointZones.entries()) {
      for (let player of players) {
        if (player.x === pointZone.x && player.y === pointZone.y) {
          let team = homeTeam.id === player.teamId ? homeTeam : awayTeam;
          team.score += 1;

          pointZones.splice(index, 1);
          pointZoneCoolDown = POINT_ZONE_CAPTURE_COOL_DOWN;
        }
      }
    }

    tick.pointZones = [...pointZones];

    for (let player of players) {
      if (player.targetX !== undefined && player.targetY !== undefined) {
        player.x = player.targetX;
        player.y = player.targetY;
        delete player.targetX;
        delete player.targetY;
      }
      tick.players.push({ ...player });
    }

    gameReplay.ticks.push(tick);
  }

  return gameReplay;
}

function loadState() {}
