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

export function simGame(seed: string, teamA: Team, teamB: Team): GameReplay {
  let gameReplay: GameReplay = {
    seed,
    ticks: [],
  };

  let aScore = 0;
  let bScore = 0;

  for (let tickCount = 0; tickCount < 10; tickCount++) {
    let tick: Tick = {
      teamActions: [
        {
          name: teamA.name,
          score: aScore,
          players: [
            {
              name: teamA.players[0].name,
              x: Math.floor(Math.random() * 10),
              y: Math.floor(Math.random() * 10),
            },
          ],
        },
        {
          name: teamB.name,
          score: bScore,
          players: teamB.players.map((player) => move(player)),
        },
      ],
    };

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
