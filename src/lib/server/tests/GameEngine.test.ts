/// <reference path="../../../../deno.d.ts" />
import { assertEquals } from '@std/assert';
import { GameEngine } from '../sim/GameEngine.ts';
import type { Player, Team, Intent } from '../sim/utils/types.d.ts';
import { GameConfig } from '../sim/gameConfig.ts';

function createDummyTeam(id: number, name: string): Team {
  return { id, name, color: '#000', score: 0 };
}

function createDummyPlayer(id: number, teamId: number, x: number, y: number): Player {
  return { id, teamId, name: `P${id}`, x, y };
}

Deno.test('GameEngine should execute a tick correctly and spawn a point zone', () => {
  const homeTeam = createDummyTeam(1, 'Home');
  const awayTeam = createDummyTeam(2, 'Away');

  const homePlayers = [createDummyPlayer(10, 1, 0, 0)];
  const awayPlayers = [createDummyPlayer(20, 2, 9, 9)];

  const homeGenerator = () => [] as Intent[];
  const awayGenerator = () => [] as Intent[];

  const engine = new GameEngine(
    homeTeam,
    homePlayers,
    homeGenerator,
    awayTeam,
    awayPlayers,
    awayGenerator,
  );

  const ticks = [];
  for (let i = 0; i <= GameConfig.INITIAL_POINT_ZONE_COOL_DOWN; i++) {
    ticks.push(engine.executeTick());
  }

  const lastTick = ticks[ticks.length - 1];
  assertEquals(lastTick.pointZones.length, 1, 'Point zone should spawn after cooldown');
});

Deno.test('GameEngine players can capture a point zone', () => {
  const homeTeam = createDummyTeam(1, 'Home');
  const awayTeam = createDummyTeam(2, 'Away');

  // Place player right where point zone will spawn initially (hardcoded seed or inject point zone)
  const homePlayers = [createDummyPlayer(10, 1, 5, 5)];
  const awayPlayers = [createDummyPlayer(20, 2, 9, 9)];

  const engine = new GameEngine(
    homeTeam,
    homePlayers,
    () => [],
    awayTeam,
    awayPlayers,
    () => [],
  );

  // Inject a point zone manually at 5,5
  engine.pointZones = [{ x: 5, y: 5 }];

  const _tick = engine.executeTick();
  assertEquals(engine.homeTeam.score, 1, 'Engine home team should have score 1');
  assertEquals(engine.pointZones.length, 0, 'Point zone should be removed after capture');
});

Deno.test('GameEngine collisions: two players targeting same empty cell bounce back', () => {
  const homeTeam = createDummyTeam(1, 'Home');
  const awayTeam = createDummyTeam(2, 'Away');

  const homePlayers = [createDummyPlayer(10, 1, 0, 0)];
  const awayPlayers = [createDummyPlayer(20, 2, 2, 0)];

  const engine = new GameEngine(
    homeTeam,
    homePlayers,
    () => [{ playerId: 10, x: 1, y: 0 }],
    awayTeam,
    awayPlayers,
    () => [{ playerId: 20, x: 1, y: 0 }],
  );

  engine.executeTick();
  assertEquals(engine.players[0].x, 0, 'P1 should bounce');
  assertEquals(engine.players[1].x, 2, 'P2 should bounce');
});

Deno.test('GameEngine collisions: player moving into stationary player bounces', () => {
  const homeTeam = createDummyTeam(1, 'Home');
  const awayTeam = createDummyTeam(2, 'Away');

  const homePlayers = [createDummyPlayer(10, 1, 0, 0)];
  const awayPlayers = [createDummyPlayer(20, 2, 1, 0)];

  const engine = new GameEngine(
    homeTeam,
    homePlayers,
    () => [{ playerId: 10, x: 1, y: 0 }],
    awayTeam,
    awayPlayers,
    () => [], // Stationary
  );

  engine.executeTick();
  assertEquals(engine.players[0].x, 0, 'P1 should bounce because P2 is stationary');
  assertEquals(engine.players[1].x, 1, 'P2 is still at 1');
});

Deno.test('GameEngine collisions: players swapping spaces successfully', () => {
  const homeTeam = createDummyTeam(1, 'Home');
  const awayTeam = createDummyTeam(2, 'Away');

  const homePlayers = [createDummyPlayer(10, 1, 0, 0)];
  const awayPlayers = [createDummyPlayer(20, 2, 1, 0)];

  const engine = new GameEngine(
    homeTeam,
    homePlayers,
    () => [{ playerId: 10, x: 1, y: 0 }],
    awayTeam,
    awayPlayers,
    () => [{ playerId: 20, x: 0, y: 0 }],
  );

  engine.executeTick();
  assertEquals(engine.players[0].x, 0, 'P1 should bounce back to 0 on swap attempt');
  assertEquals(engine.players[1].x, 1, 'P2 should bounce back to 1 on swap attempt');
});
