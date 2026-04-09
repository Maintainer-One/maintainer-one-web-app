/// <reference path="../../../../deno.d.ts" />
import { assertEquals, assertNotEquals } from "@std/assert";
import { runGame } from "../../sim/v1sim.ts";

Deno.test("runGame execution should produce the correct number of ticks", async () => {
  const replay = await runGame("Crimson", "Denim");
  // runGame uses GAME_LENGTH = 100
  assertEquals(replay.ticks.length, 100);
});

Deno.test("teams should be initialized correctly", async () => {
  const replay = await runGame("Crimson", "Denim");
  const firstTick = replay.ticks[0];
  
  assertEquals(firstTick.homeTeam.name, "Crimson");
  assertEquals(firstTick.awayTeam.name, "Denim");
  assertEquals(firstTick.players.length, 6); // 3 per team
});

Deno.test("players should move over time", async () => {
  const replay = await runGame("Crimson", "Denim");
  const firstTick = replay.ticks[0];
  const lastTick = replay.ticks[replay.ticks.length - 1];

  // We expect players to not be in the exact same spot in exactly the same way if intents have run.
  let hasMoved = false;
  for (let i = 0; i < firstTick.players.length; i++) {
    const p1 = firstTick.players[i];
    const p2 = lastTick.players.find(p => p.id === p1.id);
    if (!p2) continue;
    if (p1.x !== p2.x || p1.y !== p2.y) {
      hasMoved = true;
    }
  }

  assertEquals(hasMoved, true);
});

Deno.test("custom code with UTF-8 should not crash", async () => {
  const code = `
    // This is a comment with an emoji: 🚀
    export function generateIntents(team, opponent, players, pointZones) {
      return [];
    }
  `;
  const replay = await runGame("Amber", "Beige", code);
  assertEquals(replay.ticks.length, 100);
});

Deno.test("custom code returning undefined should be handled gracefully", async () => {
  const code = `
    export function generateIntents(team, opponent, players, pointZones) {
      // Missing return statement
    }
  `;
  const replay = await runGame("Amber", "Beige", code);
  assertEquals(replay.ticks.length, 100);
});
