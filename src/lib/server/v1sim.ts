const GAME_LENGTH = 10;
const TEAM_SIZE = 3;

type GameReplay = {
  seed: string;
  ticks: Tick[];
};

type Tick = {
  teamActions: TeamAction[];
};

type TeamAction = {
  name: string;
  score: number;
  players: PlayerAction[];
};

type PlayerAction = {
  name: string;
  x: number;
  y: number;
};

export type Team = {
  name: string;
  players: Player[];
};

export type Player = {
  name: string;
};

export function simGame(seed: string, teams: Team[]): GameReplay {
  let gameReplay: GameReplay = {
    seed,
    ticks: [],
  };

  let scores = teams.map((team) => 0);

  for (let tickCount = 0; tickCount < GAME_LENGTH; tickCount++) {
    let tick: Tick = {
      teamActions: [],
    };
    for (let [index, team] of teams.entries()) {
      let score = scores[index];

      if (Math.random() < 0.5) {
        score += Math.floor(Math.random() * 10);
        scores[index] = score;
      }
      let teamAction: TeamAction = {
        name: team.name,
        score,
        players: team.players.map((player) => {
          return {
            name: player.name,
            x: Math.floor(Math.random() * 10),
            y: Math.floor(Math.random() * 10),
          };
        }),
      };

      tick.teamActions.push(teamAction);
    }

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
