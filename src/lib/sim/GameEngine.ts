import { GameConfig } from './gameConfig.ts';
import type { Player, PointZone, Team, Tick, TeamIntentGenerator } from './utils/types';
import { MatchPCG } from './utils/random.ts';

export class GameEngine {
  private prng: MatchPCG;
  public pointZoneCoolDown: number;
  public pointZones: (PointZone & { lifespan: number; spawnProbabilities?: Record<string, number> })[] = [];
  public players: Player[];
  public metrics = {
    homeControl: 0,
    awayControl: 0,
    uncontrolled: 0,
  };

  constructor(
    public homeTeam: Team,
    public homePlayers: Player[],
    public homeIntentGenerator: TeamIntentGenerator,
    public awayTeam: Team,
    public awayPlayers: Player[],
    public awayIntentGenerator: TeamIntentGenerator,
    seed: bigint = 1067780n,
  ) {
    this.prng = new MatchPCG(seed);
    this.pointZoneCoolDown = GameConfig.INITIAL_POINT_ZONE_COOL_DOWN;
    this.players = [...this.homePlayers, ...this.awayPlayers];
  }

  public executeTick(): Tick {
    // POINT ZONE LOGIC
    if (this.pointZoneCoolDown === 0) {
      const x = Math.floor(this.prng.nextFloat() * GameConfig.GRID_WIDTH);
      const y = Math.floor(this.prng.nextFloat() * GameConfig.GRID_HEIGHT);
      
      const spawnProbabilities = this.calculateSpawnProbabilities(x, y);
      
      this.pointZones.push({
        x,
        y,
        lifespan: 5, // 5-tick despawn logic
        spawnProbabilities
      });
      this.pointZoneCoolDown = -1;
    } else if (this.pointZoneCoolDown > 0) {
      this.pointZoneCoolDown--;
    }

    // Tick down lifespans and remove despawned zones
    for (let i = this.pointZones.length - 1; i >= 0; i--) {
      this.pointZones[i].lifespan--;
      if (this.pointZones[i].lifespan < 0) {
        this.pointZones.splice(i, 1);
        this.pointZoneCoolDown = GameConfig.POINT_ZONE_CAPTURE_COOL_DOWN;
      }
    }

    // PLAYER INTENT LOGIC
    const intents = [
      ...(this.homeIntentGenerator(this.homeTeam, this.awayTeam, this.players, this.pointZones) ||
        []),
      ...(this.awayIntentGenerator(this.awayTeam, this.homeTeam, this.players, this.pointZones) ||
        []),
    ];

    // Apply intents if valid
    for (const player of this.players) {
      const intent = intents.find((intent) => player.id === intent.playerId);
      player.targetX = player.x;
      player.targetY = player.y;
      player.intentX = player.x;
      player.intentY = player.y;
      player.intentStatus = 'none';

      if (intent !== undefined) {
        player.intentX = intent.x;
        player.intentY = intent.y;

        const dx = Math.abs(intent.x - player.x);
        const dy = Math.abs(intent.y - player.y);

        if (dx + dy <= 1) {
          // 4-way movement only
          if (
            intent.x >= 0 &&
            intent.x < GameConfig.GRID_WIDTH &&
            intent.y >= 0 &&
            intent.y < GameConfig.GRID_HEIGHT
          ) {
            player.targetX = intent.x;
            player.targetY = intent.y;
            player.intentStatus = 'success'; // Tentative success
          } else {
            player.intentStatus = 'illegal'; // Out of bounds
          }
        } else {
          player.intentStatus = 'illegal'; // Too far
        }
      }
    }

    let resolving = true;
    while (resolving) {
      resolving = false;
      const targetCounts: Record<string, Player[]> = {};

      for (const player of this.players) {
        const key = `${player.targetX},${player.targetY}`;
        if (!targetCounts[key]) targetCounts[key] = [];
        targetCounts[key].push(player);
      }

      // NO-SWAPPING LOGIC
      for (const playerA of this.players) {
        if (playerA.targetX === playerA.x && playerA.targetY === playerA.y) continue;

        for (const playerB of this.players) {
          if (playerA.id === playerB.id) continue;
          if (playerB.targetX === playerB.x && playerB.targetY === playerB.y) continue;

          // Check if they are trying to swap places
          if (
            playerA.targetX === playerB.x &&
            playerA.targetY === playerB.y &&
            playerB.targetX === playerA.x &&
            playerB.targetY === playerA.y
          ) {
            playerA.targetX = playerA.x;
            playerA.targetY = playerA.y;
            playerA.intentStatus = 'collision';

            playerB.targetX = playerB.x;
            playerB.targetY = playerB.y;
            playerB.intentStatus = 'collision';
            resolving = true;
          }
        }
      }

      for (const [, playersMovingHere] of Object.entries(targetCounts)) {
        if (playersMovingHere.length > 1) {
          for (const p of playersMovingHere) {
            if (p.targetX !== p.x || p.targetY !== p.y) {
              p.targetX = p.x;
              p.targetY = p.y;
              p.intentStatus = 'collision';
              resolving = true;
            }
          }
        }
      }
    }

    // UPDATE POSITIONS
    for (const player of this.players) {
      if (player.targetX !== undefined && player.targetY !== undefined) {
        player.x = player.targetX;
        player.y = player.targetY;
        delete player.targetX;
        delete player.targetY;
      }
    }

    // SCORING LOGIC (After movement)
    for (const [index, pointZone] of this.pointZones.entries()) {
      for (const player of this.players) {
        if (player.x === pointZone.x && player.y === pointZone.y) {
          const team = this.homeTeam.id === player.teamId ? this.homeTeam : this.awayTeam;
          team.score += 1;

          this.pointZones.splice(index, 1);
          this.pointZoneCoolDown = GameConfig.POINT_ZONE_CAPTURE_COOL_DOWN;
        }
      }
    }

    // SNAPSHOT TICK (at the end)
    const tick: Tick = {
      homeTeam: { ...this.homeTeam },
      awayTeam: { ...this.awayTeam },
      players: this.players.map((p) => ({ ...p })),
      pointZones: this.pointZones.map((pz) => ({ ...pz })),
      fieldControl: this.calculateFieldControl(),
    };

    return tick;
  }

  private calculateSpawnProbabilities(x: number, y: number): Record<string, number> {
    const homeDist = Math.min(...this.homePlayers.map(p => Math.abs(p.x - x) + Math.abs(p.y - y)));
    const awayDist = Math.min(...this.awayPlayers.map(p => Math.abs(p.x - x) + Math.abs(p.y - y)));
    
    // Closer = higher probability. 0.1 to avoid div by zero.
    const hAdv = 1 / (homeDist + 0.1);
    const aAdv = 1 / (awayDist + 0.1);
    const total = hAdv + aAdv;
    
    return {
      [this.homeTeam.id]: hAdv / total,
      [this.awayTeam.id]: aAdv / total
    };
  }

  private calculateFieldControl() {
    let home = 0;
    let away = 0;
    let none = 0;

    for (let x = 0; x < GameConfig.GRID_WIDTH; x++) {
      for (let y = 0; y < GameConfig.GRID_HEIGHT; y++) {
        let nearestDist = Infinity;
        let controllingTeamId: string | null = null;
        let contested = false;

        for (const player of this.players) {
          const dist = Math.abs(player.x - x) + Math.abs(player.y - y);
          if (dist < nearestDist) {
            nearestDist = dist;
            controllingTeamId = player.teamId;
            contested = false;
          } else if (dist === nearestDist && controllingTeamId !== player.teamId) {
            contested = true;
          }
        }

        if (contested || !controllingTeamId) none++;
        else if (controllingTeamId === this.homeTeam.id) home++;
        else away++;
      }
    }

    const total = GameConfig.GRID_WIDTH * GameConfig.GRID_HEIGHT;
    return {
      home: (home / total) * 100,
      away: (away / total) * 100,
      none: (none / total) * 100
    };
  }
}
