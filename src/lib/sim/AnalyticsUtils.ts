import type { Replay, Tick } from "./utils/types";

export interface GameMetrics {
  home: TeamMetrics;
  away: TeamMetrics;
}

export interface TeamMetrics {
  controlAvg: number;
  captures: number;
  fortune: number;
  expectedCaptures: number;
  contestedCaptures: number;
  stolenCaptures: number;
  despawns: number;
}

export function generateGameRecap(replay: Replay): GameMetrics {
  const homeMetrics: TeamMetrics = {
    controlAvg: 0,
    captures: 0,
    fortune: 0,
    expectedCaptures: 0,
    contestedCaptures: 0,
    stolenCaptures: 0,
    despawns: 0,
  };

  const awayMetrics: TeamMetrics = {
    controlAvg: 0,
    captures: 0,
    fortune: 0,
    expectedCaptures: 0,
    contestedCaptures: 0,
    stolenCaptures: 0,
    despawns: 0,
  };

  let totalHomeControl = 0;
  let totalAwayControl = 0;

  for (let i = 0; i < replay.ticks.length; i++) {
    const tick = replay.ticks[i];
    const prevTick = i > 0 ? replay.ticks[i - 1] : null;

    // 1. Accumulate Control
    if (tick.fieldControl) {
      totalHomeControl += tick.fieldControl.home;
      totalAwayControl += tick.fieldControl.away;
    }

    // 2. Detect Captures and Despawns
    if (prevTick) {
      // Zone was present in prev, but gone in current
      for (const prevZone of prevTick.pointZones) {
        const stillPresent = tick.pointZones.some(
          (z) => z.x === prevZone.x && z.y === prevZone.y
        );

        if (!stillPresent) {
          // It was either captured or despawned
          const capturingHome = tick.homeTeam.score > prevTick.homeTeam.score;
          const capturingAway = tick.awayTeam.score > prevTick.awayTeam.score;

          if (capturingHome || capturingAway) {
            const teamId = capturingHome ? tick.homeTeam.id : tick.awayTeam.id;
            const metrics = capturingHome ? homeMetrics : awayMetrics;
            const otherMetrics = capturingHome ? awayMetrics : homeMetrics;
            const prob = prevZone.spawnProbabilities?.[teamId] || 0.5;

            // Update Fortune
            metrics.fortune += (1 - prob);
            // Opponent loses fortune because they failed to get a zone they had some probability of getting
            otherMetrics.fortune -= (1 - (prevZone.spawnProbabilities?.[otherMetrics === homeMetrics ? tick.homeTeam.id : tick.awayTeam.id] || 0.5));

            // Classify Capture
            metrics.captures++;
            if (prob > 0.6) metrics.expectedCaptures++;
            else if (prob < 0.4) metrics.stolenCaptures++;
            else metrics.contestedCaptures++;
          } else if (prevZone.lifespan === 0) {
            // Despawned
            homeMetrics.despawns++;
            awayMetrics.despawns++;
            
            // Both teams lose fortune for a despawn based on their missed opportunity
            homeMetrics.fortune -= (prevZone.spawnProbabilities?.[tick.homeTeam.id] || 0.5);
            awayMetrics.fortune -= (prevZone.spawnProbabilities?.[tick.awayTeam.id] || 0.5);
          }
        }
      }
    }
  }

  homeMetrics.controlAvg = totalHomeControl / replay.ticks.length;
  awayMetrics.controlAvg = totalAwayControl / replay.ticks.length;

  return {
    home: homeMetrics,
    away: awayMetrics,
  };
}
