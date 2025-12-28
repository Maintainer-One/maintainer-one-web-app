export type Team = {
  id: number;
  name: string;
  status?: "Home" | "Away";
  color: string;
  score: number;
};

export type Player = {
  id: number;
  teamId: number;
  name: string;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
};

export type Intent = {
  playerId: number;
  x: number;
  y: number;
};

export type Game = {
  ticks: Tick[];
};

export type Replay = {
  ticks: Tick[];
};

export type Tick = {
  homeTeam: Team;
  awayTeam: Team;
  players: Player[];
};

export type TeamLoadFunction = (
  team?: Team,
  players?: Player[],
) => [Team, Player[], TeamIntentGenerator];

export type TeamIntentGenerator = (
  team: Team,
  opponent: Team,
  players: Players,
) => Intent[];
