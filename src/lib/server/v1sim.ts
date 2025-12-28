import { loadBeigeTeam } from "./beigeTeam.ts";
import { loadAmberTeam } from "./amberTeam.ts";
import type { Game, Player, TeamLoadFunction, Tick } from "./types.d.ts";
import { loadCrimsonTeam } from "./crimsonTeam.ts";
import { loadDenimTeam } from "./denimTeam.ts";

let teamMap: Record<string, TeamLoadFunction> = {
  Amber: loadAmberTeam,
  Beige: loadBeigeTeam,
  Crimson: loadCrimsonTeam,
  Denim: loadDenimTeam,
};

const GAME_LENGTH = 20;

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
      },
    ],
  };

  for (let tickCount = 0; tickCount < GAME_LENGTH - 1; tickCount++) {
    let intents = [
      ...homeIntentGenerator(homeTeam, awayTeam, players),
      ...awayIntentGenerator(awayTeam, homeTeam, players),
    ];

    let tick: Tick = {
      homeTeam: { ...homeTeam },
      awayTeam: { ...awayTeam },
      players: [],
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
      console.log(key);
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

    gameReplay.ticks.push(tick);
    console.log(`--- END ${tickCount + 1} TICK ---`);
  }

  return gameReplay;
}
