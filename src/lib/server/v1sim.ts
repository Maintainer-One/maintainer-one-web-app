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

const GAME_LENGTH = 10;

export function runGame(homeTeamName: string, awayTeamName: string): Game {
  let [homeTeam, homePlayers, homeIntentGenerator] = teamMap[homeTeamName]();
  let [awayTeam, awayPlayers, awayIntentGenerator] = teamMap[awayTeamName]();

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

    for (let player of players) {
      let intent = intents.find((intent) => player.id === intent.playerId);

      if (intent === undefined) {
        tick.players.push(player);
        continue;
      }

      let intentIsValid = true;

      if (intent.x > 9 || intent.y > 9 || intent.x < 0 || intent.y < 0) {
        intentIsValid = false;
      }

      if (intentIsValid) {
        tick.players.push({
          ...player,
          x: intent.x,
          y: intent.y,
        });
        player.x = intent.x;
        player.y = intent.y;
      } else {
        tick.players.push(player);
      }
    }

    gameReplay.ticks.push(tick);
  }

  return gameReplay;
}
