import type { TeamAction } from "./v1sim.ts";

type Intent = {
  playerId: number;
  x: number;
  y: number;
};

export type Player = {
  id: number;
  name: string;
  x: number;
  y: number;
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
    let intents: Intent[] = [];
    for (let player of this.players) {
      intents.push({
        playerId: player.id,
        x: player.x + 1,
        y: player.y + 1,
      });
    }
    return intents;
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
