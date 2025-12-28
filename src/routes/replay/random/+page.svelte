<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  let canvas: HTMLCanvasElement;

  let width = 300;
  let height = 300;
  const cellSize = 30;

  let tick = $state(0);
  let controlStats = $derived.by(() => {
    let left = 0;
    let right = 0;
    let none = 0;
    let map: { x: number; y: number; color: string }[] = [];

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        let control: {
          color: string | undefined;
          distance: number | undefined;
        } = {
          color: undefined,
          distance: undefined,
        };

        for (let player of data.game.ticks[tick].players) {
            let team = data.game.ticks[tick].awayTeam.id === player.teamId ? data.game.ticks[tick].awayTeam : data.game.ticks[tick].homeTeam
            let distance = Math.abs(player.x - x) + Math.abs(player.y - y);

            if (
              control.distance === undefined || distance < control.distance
            ) {
              control.color = team.color;
              control.distance = distance;
            } else if (
              distance === control.distance &&
              control.color !== team.color
            ) {
              control.color = undefined;
            }
        }

        switch (control.color) {
          case data.game.ticks[tick].homeTeam.color:
            left += 1;
            break;
          case data.game.ticks[tick].awayTeam.color:
            right += 1;
            break;
          default:
            none += 1;
            break;
        }

        if (control.color === undefined || control.distance === undefined) {
          continue;
        }

        map.push({ x, y, color: control.color });
      }
    }
    return { left, right, none, map };
  });

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

    data.game.ticks[tick].players.forEach((player) => {
      let team = data.game.ticks[tick].awayTeam.id === player.teamId ? data.game.ticks[tick].awayTeam : data.game.ticks[tick].homeTeam
      ctx.beginPath();
      ctx.fillStyle = team.color;
      ctx.arc(
        player.x * cellSize + (cellSize / 2),
        player.y * cellSize + (cellSize / 2),
        cellSize * 0.35,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    for (let square of controlStats.map) {
      ctx.beginPath();
      ctx.fillStyle = hexToRgba(square.color, 0.1);
      ctx.fillRect(
        square.x * cellSize,
        square.y * cellSize,
        32,
        32,
      );
    }
  });

  // TODO: This was copied from stack overflow and needs to be cleaned up
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
    <div
      class="flex flex-col items-center gap-4"
    >
      <div class="flex justify-around w-full">
        <div class="flex flex-col">
          <p>{data.game.ticks[tick].homeTeam.name}</p>
        </div>
        <div class="flex flex-col">
          <p>Tick</p>
          <p>{tick}</p>
        </div>
        <div class="flex flex-col">
          <p>{data.game.ticks[tick].awayTeam.name}</p>
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
        <div class="mt-4 w-full px-4">
          <div class="flex h-6 w-full rounded-full overflow-hidden border border-gray-700 bg-gray-900">
            <div
              class="h-full transition-all duration-300 ease-in-out"
              style="width: {controlStats.left}%; background-color: {data.game.ticks[tick].homeTeam.color};"
            ></div>

            <div
              class="h-full bg-gray-700 transition-all duration-300 ease-in-out"
              style="width: {controlStats.none}%;"
            ></div>

            <div
              class="h-full transition-all duration-300 ease-in-out"
              style="width: {controlStats.right}%; background-color: {data.game.ticks[tick].awayTeam.color};"
            ></div>
          </div>

          <div class="flex justify-between text-sm mt-1 text-gray-400">
            <span>{controlStats.left}%</span>
            <span>{controlStats.none}%</span>
            <span>{controlStats.right}%</span>
          </div>
        </div>
    </div>
  </div>
</div>
