import { loadBeigeTeam } from "./beigeTeam.ts";
import { loadAmberTeam } from "./amberTeam.ts";
import type {
  Game,
  Player,
  PointZone,
  TeamLoadFunction,
  Tick,
} from "./types.d.ts";
import { loadCrimsonTeam } from "./crimsonTeam.ts";
import { loadDenimTeam } from "./denimTeam.ts";

let teamMap: Record<string, TeamLoadFunction> = {
  Amber: loadAmberTeam,
  Beige: loadBeigeTeam,
  Crimson: loadCrimsonTeam,
  Denim: loadDenimTeam,
};

const GAME_LENGTH = 20;
const POINT_ZONE_CAPTURE_COOL_DOWN = 3;

export function runGame(homeTeamName: string, awayTeamName: string): Game {
  let [homeTeam, homePlayers, homeIntentGenerator] = teamMap[homeTeamName]();
  let [awayTeam, awayPlayers, awayIntentGenerator] = teamMap[awayTeamName]();

  homeTeam.status = "Home";
  awayTeam.status = "Away";

  for (let player of homePlayers) {
    player.x = 0;
  }

  for (let player of awayPlayers) {
    player.x = 9;
  }

  let players: Player[] = [...homePlayers, ...awayPlayers];

  let gameReplay: Game = {
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
    // PLAYER INTENT LOGIC
    let intents = [
      ...homeIntentGenerator(homeTeam, awayTeam, players),
      ...awayIntentGenerator(awayTeam, homeTeam, players),
    ];

    let tick: Tick = {
      homeTeam: { ...homeTeam },
      awayTeam: { ...awayTeam },
      players: [],
      pointZones: [],
    };

    let occupied: Record<string, Player> = {};

    for (let player of players) {
      occupied[`${player.x},${player.y}`] = player;
    }

    let collisions: Record<string, Player[]> = {};

    for (let player of players) {
      let intent = intents.find((intent) => player.id === intent.playerId);

      if (intent === undefined) {
        tick.players.push(player);
        continue;
      }

      if (intent.x > 9 || intent.y > 9 || intent.x < 0 || intent.y < 0) {
        console.log(tickCount, player);
        continue;
      } else if (occupied[`${intent.x},${intent.y}`]) {
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
      for (let player of collidingPlayers) {
        if (occupier === undefined) {
          occupier = player;
        } else if (occupier.targetX !== x && occupier.targetY !== y) {
          occupier = undefined;
        } else if (occupier.id !== player.id) {
          delete occupier.targetX;
          delete occupier.targetY;
          delete player.targetX;
          delete player.targetY;
        }
      }
    }

    for (let player of players) {
      if (player.targetX && player.targetY) {
        player.x = player.targetX;
        player.y = player.targetY;
        delete player.targetX;
        delete player.targetY;
      }
      tick.players.push({ ...player });
    }

    // POINT ZONE LOGIC
    if (pointZoneCoolDown === 0) {
      pointZones.push({
        x: Math.floor(Math.random() * 10),
        y: Math.floor(Math.random() * 10),
      });
      pointZoneCoolDown = -1;
    } else if (pointZoneCoolDown > 0) {
      pointZoneCoolDown--;
    }

    tick.pointZones = [...pointZones];

    gameReplay.ticks.push(tick);
  }

  return gameReplay;
}
