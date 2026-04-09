import { loadBeigeTeam } from './teamLogic/beigeTeam.ts';
import { loadAmberTeam } from './teamLogic/amberTeam.ts';
import { loadCrimsonTeam } from './teamLogic/crimsonTeam.ts';
import { loadDenimTeam } from './teamLogic/denimTeam.ts';
import type { Replay, TeamLoadFunction, TeamIntentGenerator } from './utils/types';
import { GameConfig } from './gameConfig.ts';
import { GameEngine } from './GameEngine.ts';

const teamMap: Record<string, TeamLoadFunction> = {
  Amber: loadAmberTeam,
  Beige: loadBeigeTeam,
  Crimson: loadCrimsonTeam,
  Denim: loadDenimTeam,
};

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function runGame(
  homeTeamName: string,
  awayTeamName: string,
  homeCode?: string,
  awayCode?: string,
): Promise<Replay> {
  let [homeTeam, homePlayers, homeIntentGenerator] = teamMap[homeTeamName]();
  let [awayTeam, awayPlayers, awayIntentGenerator] = teamMap[awayTeamName]();

  if (homeCode) {
    try {
      const b64 = toBase64(homeCode);
      const mod = await import(`data:application/javascript;base64,${b64}`);
      if (mod.generateIntents && typeof mod.generateIntents === 'function') {
        homeIntentGenerator = mod.generateIntents;
      }
    } catch (e) {
      console.error('Error loading home team code:', e);
    }
  }

  if (awayCode) {
    try {
      const b64 = toBase64(awayCode);
      const mod = await import(`data:application/javascript;base64,${b64}`);
      if (mod.generateIntents && typeof mod.generateIntents === 'function') {
        awayIntentGenerator = mod.generateIntents;
      }
    } catch (e) {
      console.error('Error loading away team code:', e);
    }
  }

  const seed = BigInt(Math.floor(Math.random() * 10000000));

  homeTeam.status = 'Home';
  awayTeam.status = 'Away';

  for (const player of homePlayers) {
    player.x = 0;
  }

  for (const player of awayPlayers) {
    player.x = GameConfig.GRID_WIDTH - 1;
  }

  const engine = new GameEngine(
    homeTeam,
    homePlayers,
    homeIntentGenerator,
    awayTeam,
    awayPlayers,
    awayIntentGenerator,
    seed,
  );

  const gameReplay: Replay = {
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
