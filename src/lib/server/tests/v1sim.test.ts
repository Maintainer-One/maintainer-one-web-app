/// <reference path="../../../../deno.d.ts" />
import { assertEquals, assertNotEquals } from '@std/assert';
import { runGame } from '../../sim/v1sim.ts';

Deno.test('runGame execution should produce the correct number of ticks', async () => {
  const replay = await runGame('Crimson', 'Denim');
  // runGame uses GAME_LENGTH = 100
  assertEquals(replay.ticks.length, 100);
});

Deno.test('teams should be initialized correctly', async () => {
  const replay = await runGame('Crimson', 'Denim');
  const firstTick = replay.ticks[0];

  assertEquals(firstTick.homeTeam.name, 'Crimson');
  assertEquals(firstTick.awayTeam.name, 'Denim');
  assertEquals(firstTick.players.length, 6); // 3 per team
});

Deno.test('players should move over time', async () => {
  const replay = await runGame('Crimson', 'Denim');
  const firstTick = replay.ticks[0];
  const lastTick = replay.ticks[replay.ticks.length - 1];

  // We expect players to not be in the exact same spot in exactly the same way if intents have run.
  let hasMoved = false;
  for (let i = 0; i < firstTick.players.length; i++) {
    const p1 = firstTick.players[i];
    const p2 = lastTick.players.find((p) => p.id === p1.id);
    if (!p2) continue;
    if (p1.x !== p2.x || p1.y !== p2.y) {
      hasMoved = true;
    }
  }

  assertEquals(hasMoved, true);
});

Deno.test('custom code with UTF-8 should not crash', async () => {
  const code = `
    // This is a comment with an emoji: 🚀
    export function generateIntents(team, opponent, players, pointZones) {
      return [];
    }
  `;
  const replay = await runGame('Amber', 'Beige', code);
  assertEquals(replay.ticks.length, 100);
});

Deno.test('custom code returning undefined should be handled gracefully', async () => {
  const code = `
    export function generateIntents(team, opponent, players, pointZones) {
      // Missing return statement
    }
  `;
  const replay = await runGame('Amber', 'Beige', code);
  assertEquals(replay.ticks.length, 100);
});

Deno.test('teleportation should be rejected', async () => {
  const code = `
    export function generateIntents(team, opponent, players, pointZones) {
      const p = players.find(p => p.teamId === team.id);
      return [{ playerId: p.id, x: p.x + 5, y: p.y }]; // Move 5 squares
    }
  `;
  const replay = await runGame('Amber', 'Beige', code);
  const firstTick = replay.ticks[0];
  const secondTick = replay.ticks[1];

  const p1 = firstTick.players.find((p) => p.teamId === firstTick.homeTeam.id)!;
  const p2 = secondTick.players.find((p) => p.id === p1.id)!;

  // Player should not have moved
  assertEquals(p2.x, p1.x);
  assertEquals(p2.y, p1.y);
  assertEquals(p2.intentStatus, 'illegal');
});

Deno.test('diagonal movement should be rejected', async () => {
  const code = `
    export function generateIntents(team, opponent, players, pointZones) {
      const p = players.find(p => p.teamId === team.id);
      return [{ playerId: p.id, x: p.x + 1, y: p.y + 1 }]; // Diagonal
    }
  `;
  const replay = await runGame('Amber', 'Beige', code);
  const firstTick = replay.ticks[0];
  const secondTick = replay.ticks[1];

  const p1 = firstTick.players.find((p) => p.teamId === firstTick.homeTeam.id)!;
  const p2 = secondTick.players.find((p) => p.id === p1.id)!;

  // Player should not have moved
  assertEquals(p2.x, p1.x);
  assertEquals(p2.y, p1.y);
  assertEquals(p2.intentStatus, 'illegal');
});

Deno.test('collision should be flagged', async () => {
  // Setup two players trying to move into the same square
  const homeCode = `
    export function generateIntents(team, opponent, players, pointZones) {
      const p = players.find(p => p.teamId === team.id);
      return [{ playerId: p.id, x: 1, y: 1 }];
    }
  `;
  const awayCode = `
    export function generateIntents(team, opponent, players, pointZones) {
      const p = players.find(p => p.teamId === team.id);
      return [{ playerId: p.id, x: 1, y: 1 }];
    }
  `;

  // Note: We need to make sure they can reach [1,1] in 1 tick.
  // Home starts at [0, 2], [0, 4], [0, 7].
  // Away starts at [9, 2], [9, 4], [9, 7].
  // Let's use custom players starting adjacent to [1,1].

  const replay = await runGame('Amber', 'Beige', homeCode, awayCode);
  const secondTick = replay.ticks[1];

  // Check if any player has 'collision' status
  const hasCollision = secondTick.players.some((p) => p.intentStatus === 'collision');
  assertEquals(hasCollision, true);
});
