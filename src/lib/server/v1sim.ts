import { randomMoveIntentGenerator, Team } from "./teamLogic.ts";
import { loadBlueTeam } from "./blueTeam.ts";
import { loadAmberTeam } from "./amberTeam.ts";

let teamMap: Record<string, Team> = {
  Amber: loadAmberTeam(),
  Blue: loadBlueTeam(),
};

const GAME_LENGTH = 10;

type GameReplay = {
  ticks: Tick[];
};

type Tick = {
  teamActions: TeamAction[];
};

export type TeamAction = {
  name: string;
  color: string;
  players: PlayerAction[];
};

type PlayerAction = {
  name: string;
  x: number;
  y: number;
};

type Intent = {
  playerId: number;
  x: number;
  y: number;
};

export function runGame(
  homeTeamName: string,
  awayTeamName: string
): GameReplay {
  let homeTeam = teamMap[homeTeamName];
  let awayTeam = teamMap[awayTeamName];

  let gameReplay: GameReplay = {
    ticks: [],
  };

  for (let tickCount = 0; tickCount < GAME_LENGTH; tickCount++) {
    let tick: Tick = {
      teamActions: [],
    };

    let intents = [
      ...homeTeam.generateIntents(),
      ...awayTeam.generateIntents(),
    ];

    tick.teamActions.push(homeTeam.randomMoveIntentGenerator());
    tick.teamActions.push(awayTeam.randomMoveIntentGenerator());

    gameReplay.ticks.push(tick);
  }

  return gameReplay;
}
