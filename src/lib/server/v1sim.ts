import { loadBlueTeam } from "./blueTeam.ts";
import { loadAmberTeam } from "./amberTeam.ts";
import type { Game, Player, Team, TeamLoadFunction, Tick } from "./types.d.ts";

let teamMap: Record<string, TeamLoadFunction> = {
  Amber: loadAmberTeam,
  Blue: loadBlueTeam,
};

const GAME_LENGTH = 10;

export function runGame(homeTeamName: string, awayTeamName: string): Game {
  let [homeTeam, homePlayers, homeIntentGenerator] = teamMap[homeTeamName]();
  let [awayTeam, awayPlayers, awayIntentGenerator] = teamMap[awayTeamName]();

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

      tick.players.push({
        ...player,
        x: intent.x,
        y: intent.y,
      });
      player.x = intent.x;
      player.y = intent.y;
    }

    gameReplay.ticks.push(tick);
  }

  return gameReplay;
}
