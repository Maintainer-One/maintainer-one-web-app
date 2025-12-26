import type { TeamAction } from "./v1sim.ts";

export type Player = {
  id: number;
  name: string;
};

export class Team {
  name: string;
  color: string;
  players: Player[];

  constructor(name: string, color: string, players: Player[]) {
    this.name = name;
    this.color = color;
    this.players = players;
  }

  generateIntents() {
    return [{ playerId: 1, x: 1, y: 2 }];
  }

  randomMoveIntentGenerator() {
    let teamAction: TeamAction = {
      name: this.name,
      color: this.color,
      players: this.players.map((player) => {
        return {
          name: player.name,
          x: Math.floor(Math.random() * 10),
          y: Math.floor(Math.random() * 10),
        };
      }),
    };
    return teamAction;
  }
}
