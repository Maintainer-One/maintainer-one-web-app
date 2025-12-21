<script lang="ts">
  import { onMount } from "svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  let canvas: HTMLCanvasElement;

  let width = 300;
  let height = 300;
  const cellSize = 30;

  let tick = $state(0);

  let isPlaying = $state(false);

  $effect(() => {
    if (isPlaying) {
      setTimeout(() => {
        tick += 1;
      }, 1000);
    }
    if (tick > data.game.ticks.length) {
      return;
    }
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(50, 50, 50, 1)";
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x <= width; x += cellSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    for (let y = 0; y <= height; y += cellSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    data.game.ticks[tick].teamActions[0].players.forEach((player) => {
      ctx.beginPath();
      ctx.fillStyle = "#dc2626";
      ctx.arc(
        player.x * cellSize + (cellSize / 2),
        player.y * cellSize + (cellSize / 2),
        cellSize * 0.35,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    data.game.ticks[tick].teamActions[1].players.forEach((player) => {
      ctx.beginPath();
      ctx.fillStyle = "#6b7280";
      ctx.arc(
        player.x * cellSize + (cellSize / 2),
        player.y * cellSize + (cellSize / 2),
        cellSize * 0.35,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });
  });
</script>

<div
  class="min-h-screen flex flex-col space-around bg-black text-gray-200 selection:bg-red-900 selection:text-white justify-around"
>
  <div
    class="flex flex-wrap flex-row justify-around"
  >
    <aside>
      <h2>{data.game.ticks[tick].teamActions[0].name} Players</h2>
      <ul>
        {#each data.game.ticks[tick].teamActions[0].players as player}
          <li>{player.name}</li>
        {/each}
      </ul>
    </aside>
    <div
      class="flex flex-col items-center gap-4"
    >
      <div class="flex justify-around w-full">
        <div class="flex flex-col">
          <p>{data.game.ticks[tick].teamActions[0].name}</p>
          <p>{data.game.ticks[tick].teamActions[0].score}</p>
        </div>
        <div class="flex flex-col">
          <p>Tick</p>
          <p>{tick}</p>
        </div>
        <div class="flex flex-col">
          <p>{data.game.ticks[tick].teamActions[1].name}</p>
          <p>{data.game.ticks[tick].teamActions[1].score}</p>
        </div>
      </div>
      <canvas {width} {height} bind:this={canvas}></canvas>
      <div class="flex w-full justify-around">
        <button onclick={() => isPlaying = !isPlaying}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          class="grow ml-4"
          bind:value={tick}
          type="range"
          min={0}
          max={data.game.ticks.length - 1}
        >
      </div>
    </div>
    <aside>
      <h2>{data.game.ticks[tick].teamActions[1].name} Players</h2>
      <ul>
        {#each data.game.ticks[tick].teamActions[1].players as player}
          <li>{player.name}</li>
        {/each}
      </ul>
    </aside>
  </div>
</div>
