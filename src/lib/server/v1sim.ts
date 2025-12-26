import { randomMoveIntentGenerator } from "./teamLogic.ts";
import { blueTeam } from "./blueTeam.ts";
import { amberTeam } from "./amberTeam.ts";

let teamMap: Record<string, Team> = {
  Amber: amberTeam,
  Blue: blueTeam,
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

export type Team = {
  name: string;
  color: string;
  players: Player[];
};

export type Player = {
  name: string;
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

    tick.teamActions.push(randomMoveIntentGenerator(homeTeam));
    tick.teamActions.push(randomMoveIntentGenerator(awayTeam));

    gameReplay.ticks.push(tick);
  }

  return gameReplay;
}

function move(player: Player): PlayerAction {
  return {
    name: player.name,
    x: Math.floor(Math.random() * 10),
    y: Math.floor(Math.random() * 10),
  };
}
