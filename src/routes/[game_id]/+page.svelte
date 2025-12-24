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

    for (let teamAction of data.game.ticks[tick].teamActions) {
      teamAction.players.forEach((player) => {
        ctx.beginPath();
        ctx.fillStyle = teamAction.color;
        ctx.arc(
          player.x * cellSize + (cellSize / 2),
          player.y * cellSize + (cellSize / 2),
          cellSize * 0.35,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });
    }

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        let control: {
          color: string | undefined;
          distance: number | undefined;
        } = {
          color: undefined,
          distance: undefined,
        };

        for (let teamAction of data.game.ticks[tick].teamActions) {
          for (let player of teamAction.players) {
            let distance = Math.abs(player.x - x) + Math.abs(player.y - y);

            if (
              control.distance === undefined || distance < control.distance
            ) {
              control.color = teamAction.color;
              control.distance = distance;
            } else if (distance === control.distance) {
              control.color = undefined;
            }
          }
        }

        if (control.color === undefined || control.distance === undefined) {
          continue;
        }

        ctx.beginPath();
        ctx.fillStyle = hexToRgba(control.color, 0.1);
        ctx.fillRect(
          x * cellSize,
          y * cellSize,
          32,
          32,
        );
      }
    }
  });

  function hexToRgba(hex: string, opacity: number) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split("");
      if (c.length == 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = "0x" + c.join("");
      return "rgba(" +
        [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") +
        `,${opacity})`;
    }
    throw new Error("Bad Hex");
  }
</script>

<div
  class="min-h-screen flex flex-col space-around bg-black text-gray-200 selection:bg-red-900 selection:text-white justify-around"
>
  <div
    class="flex flex-wrap flex-row justify-around"
  >
    <aside>
      <h2 class="text-lg border-b">
        {data.game.ticks[tick].teamActions[0].name}
      </h2>
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
      <h2 class="text-lg border-b">
        {data.game.ticks[tick].teamActions[1].name}
      </h2>
      <ul>
        {#each data.game.ticks[tick].teamActions[1].players as player}
          <li>{player.name}</li>
        {/each}
      </ul>
    </aside>
  </div>
</div>
