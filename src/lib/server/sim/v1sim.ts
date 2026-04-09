import { loadBeigeTeam } from "../teamLogic/beigeTeam.ts";
import { loadAmberTeam } from "../teamLogic/amberTeam.ts";
import { loadCrimsonTeam } from "../teamLogic/crimsonTeam.ts";
import { loadDenimTeam } from "../teamLogic/denimTeam.ts";
import type {
  Replay,
  TeamLoadFunction,
  TeamIntentGenerator
} from "./utils/types";
import { GameConfig } from "./gameConfig.ts";
import { GameEngine } from "./GameEngine.ts";

let teamMap: Record<string, TeamLoadFunction> = {
  Amber: loadAmberTeam,
  Beige: loadBeigeTeam,
  Crimson: loadCrimsonTeam,
  Denim: loadDenimTeam,
};

export async function runGame(
  homeTeamName: string, 
  awayTeamName: string,
  homeCode?: string,
  awayCode?: string
): Promise<Replay> {
  let [homeTeam, homePlayers, homeIntentGenerator] = teamMap[homeTeamName]();
  let [awayTeam, awayPlayers, awayIntentGenerator] = teamMap[awayTeamName]();

  if (homeCode) {
    const b64 = btoa(homeCode);
    const mod = await import(`data:application/javascript;base64,${b64}`);
    if (mod.generateIntents) {
      homeIntentGenerator = mod.generateIntents;
    }
  }

  if (awayCode) {
    const b64 = btoa(awayCode);
    const mod = await import(`data:application/javascript;base64,${b64}`);
    if (mod.generateIntents) {
      awayIntentGenerator = mod.generateIntents;
    }
  }

  let seed = BigInt(Math.floor(Math.random() * 10000000));

  homeTeam.status = "Home";
  awayTeam.status = "Away";

  for (let player of homePlayers) {
    player.x = 0;
  }

  for (let player of awayPlayers) {
    player.x = GameConfig.GRID_WIDTH - 1;
  }

  const engine = new GameEngine(
    homeTeam,
    homePlayers,
    homeIntentGenerator,
    awayTeam,
    awayPlayers,
    awayIntentGenerator,
    seed
  );

  let gameReplay: Replay = {
    ticks: [
      {
        homeTeam: { ...homeTeam },
        awayTeam: { ...awayTeam },
        players: engine.players.map((player) => ({ ...player })),
        pointZones: [],
      },
    ],
  };

  for (let tickCount = 0; tickCount < GameConfig.GAME_LENGTH - 1; tickCount++) {
    gameReplay.ticks.push(engine.executeTick());
  }

  return gameReplay;
}
