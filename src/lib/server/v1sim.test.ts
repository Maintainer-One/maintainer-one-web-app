/// <reference lib="deno.ns" />
import { assertEquals, assertNotEquals } from "@std/assert";
import { runGame } from "./v1sim.ts";

Deno.test("runGame execution should produce the correct number of ticks", () => {
  const replay = runGame("Crimson", "Denim");
  // runGame uses GAME_LENGTH = 10, so it produces 10 ticks (1 initial + 9 ticks)
  assertEquals(replay.ticks.length, 10);
});

Deno.test("teams should be initialized correctly", () => {
  const replay = runGame("Crimson", "Denim");
  const firstTick = replay.ticks[0];
  
  assertEquals(firstTick.homeTeam.name, "Crimson");
  assertEquals(firstTick.awayTeam.name, "Denim");
  assertEquals(firstTick.players.length, 6); // 3 per team
});

Deno.test("players should move over time", () => {
  const replay = runGame("Crimson", "Denim");
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
