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
  status?: string; 
};

export type Game = {
  teams: Team[];
  players: Player[];
  pointZone: PointZone;
};

export type Replay = {
  ticks: Tick[];
};

export type Tick = {
  homeTeam: Team;
  awayTeam: Team;
  players: Player[];
  pointZones: PointZone[];
};

export type PointZone = {
  x: number;
  y: number;
};

export type TeamLoadFunction = (
  team?: Team,
  players?: Player[]
) => [Team, Player[], TeamIntentGenerator];

export type TeamIntentGenerator = (
  team: Team,
  opponent: Team,
  players: Players,
  pointZones: PointZone[]
) => Intent[];
