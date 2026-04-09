import { GameConfig } from "./gameConfig.ts";
import type { Player, PointZone, Team, Tick, Intent, TeamIntentGenerator } from "./utils/types";
import { MatchPCG } from "./utils/random.ts";

export class GameEngine {
  private prng: MatchPCG;
  public pointZoneCoolDown: number;
  public pointZones: PointZone[] = [];
  public players: Player[];

  constructor(
    public homeTeam: Team,
    public homePlayers: Player[],
    public homeIntentGenerator: TeamIntentGenerator,
    public awayTeam: Team,
    public awayPlayers: Player[],
    public awayIntentGenerator: TeamIntentGenerator,
    seed: bigint = 1067780n
  ) {
    this.prng = new MatchPCG(seed);
    this.pointZoneCoolDown = GameConfig.INITIAL_POINT_ZONE_COOL_DOWN;
    this.players = [...this.homePlayers, ...this.awayPlayers];
  }

  public executeTick(): Tick {
    // POINT ZONE LOGIC
    if (this.pointZoneCoolDown === 0) {
      this.pointZones.push({
        x: Math.floor(this.prng.nextFloat() * GameConfig.GRID_WIDTH),
        y: Math.floor(this.prng.nextFloat() * GameConfig.GRID_HEIGHT),
      });
      this.pointZoneCoolDown = -1;
    } else if (this.pointZoneCoolDown > 0) {
      this.pointZoneCoolDown--;
    }

    // PLAYER INTENT LOGIC
    let intents = [
      ...(this.homeIntentGenerator(this.homeTeam, this.awayTeam, this.players, this.pointZones) || []),
      ...(this.awayIntentGenerator(this.awayTeam, this.homeTeam, this.players, this.pointZones) || []),
    ];

    // Apply intents if valid
    for (let player of this.players) {
      let intent = intents.find((intent) => player.id === intent.playerId);
      player.targetX = player.x;
      player.targetY = player.y;
      player.intentX = player.x;
      player.intentY = player.y;

      if (intent !== undefined) {
        player.intentX = intent.x;
        player.intentY = intent.y;
        
        if (intent.x >= 0 && intent.x < GameConfig.GRID_WIDTH && intent.y >= 0 && intent.y < GameConfig.GRID_HEIGHT) {
          player.targetX = intent.x;
          player.targetY = intent.y;
        }
      }
    }

    let resolving = true;
    while (resolving) {
      resolving = false;
      let targetCounts: Record<string, Player[]> = {};
      
      for (let player of this.players) {
        let key = `${player.targetX},${player.targetY}`;
        if (!targetCounts[key]) targetCounts[key] = [];
        targetCounts[key].push(player);
      }

      // NO-SWAPPING LOGIC
      for (let playerA of this.players) {
        if (playerA.targetX === playerA.x && playerA.targetY === playerA.y) continue;
        
        for (let playerB of this.players) {
          if (playerA.id === playerB.id) continue;
          if (playerB.targetX === playerB.x && playerB.targetY === playerB.y) continue;

          // Check if they are trying to swap places
          if (playerA.targetX === playerB.x && playerA.targetY === playerB.y &&
              playerB.targetX === playerA.x && playerB.targetY === playerA.y) {
            
            playerA.targetX = playerA.x;
            playerA.targetY = playerA.y;
            playerB.targetX = playerB.x;
            playerB.targetY = playerB.y;
            resolving = true;
          }
        }
      }

      for (let [key, playersMovingHere] of Object.entries(targetCounts)) {
        if (playersMovingHere.length > 1) {
          for (let p of playersMovingHere) {
            if (p.targetX !== p.x || p.targetY !== p.y) {
              p.targetX = p.x;
              p.targetY = p.y;
              resolving = true;
            }
          }
        }
      }
    }

    // UPDATE POSITIONS
    for (let player of this.players) {
      if (player.targetX !== undefined && player.targetY !== undefined) {
        player.x = player.targetX;
        player.y = player.targetY;
        delete player.targetX;
        delete player.targetY;
      }
    }

    // SCORING LOGIC (After movement)
    for (let [index, pointZone] of this.pointZones.entries()) {
      for (let player of this.players) {
        if (player.x === pointZone.x && player.y === pointZone.y) {
          let team = this.homeTeam.id === player.teamId ? this.homeTeam : this.awayTeam;
          team.score += 1;

          this.pointZones.splice(index, 1);
          this.pointZoneCoolDown = GameConfig.POINT_ZONE_CAPTURE_COOL_DOWN;
        }
      }
    }

    // SNAPSHOT TICK (at the end)
    let tick: Tick = {
      homeTeam: { ...this.homeTeam },
      awayTeam: { ...this.awayTeam },
      players: this.players.map(p => ({ ...p })),
      pointZones: [...this.pointZones],
    };

    return tick;
  }
}
