<script lang="ts">
  import { onMount } from "svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  let canvas: HTMLCanvasElement;

  let width = 300;
  let height = 300;
  const cellSize = 30;

  let tick = 1;

  function draw() {
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

    data.game.ticks[0].a.players.forEach((player) => {
      console.log(player);
      ctx.beginPath();
      ctx.fillStyle = "#dc2626";
      ctx.arc(
        player.x * cellSize - (cellSize / 2),
        player.y * cellSize - (cellSize / 2),
        cellSize * 0.35,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    data.game.ticks[0].b.players.forEach((player) => {
      console.log(player);
      ctx.beginPath();
      ctx.fillStyle = "#6b7280";
      ctx.arc(
        player.x * cellSize - (cellSize / 2),
        player.y * cellSize - (cellSize / 2),
        cellSize * 0.35,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });
  }

  onMount(() => {
    draw();
  });
</script>

<div
  class="bg-black min-h-screen text-gray-200 selection:bg-red-900 selection:text-white pt-8 flex items-center flex-wrap flex-row justify-around"
>
  <aside>
    <h2>Red Team</h2>
    <ul>
      {#each data.game.ticks[tick].a.players as player}
        <li>{player.name}</li>
      {/each}
    </ul>
  </aside>
  <div
    class="flex flex-col items-center gap-4"
  >
    <p>Score</p>
    <canvas {width} {height} bind:this={canvas}></canvas>
  </div>
  <aside>
    <h2>Gray Team</h2>
    <ul>
      {#each data.game.ticks[tick].b.players as player}
        <li>{player.name}</li>
      {/each}
    </ul>
  </aside>
</div>
