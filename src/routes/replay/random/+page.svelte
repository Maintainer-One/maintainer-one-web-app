<script lang="ts">
  import type { ActionData, PageProps } from "./$types";
  import { onMount } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { javascript } from "@codemirror/lang-javascript";
  import { oneDark } from "@codemirror/theme-one-dark";
  import { enhance } from "$app/forms";

  let { data, form }: PageProps = $props();

  // Use form result if available, otherwise data
  let game = $derived(form?.game ?? data.game);

  let canvas: HTMLCanvasElement;
  let width = 600;
  let height = 600;
  const gridSize = 10;
  let cellSize = $derived(width / gridSize);

  let tick = $state(0);
  let isPlaying = $state(false);
  let playbackSpeed = $state(1000); // ms per tick (1x = 1s)

  let activeTab = $state("info"); // "info" | "home" | "away"

  let homeCode = $state(form?.homeCode ?? `/**
 * Team: Amber
 * @param {Team} team - Your team stats
 * @param {Team} opponent - Opponent team stats
 * @param {Player[]} players - All players on the field
 * @param {PointZone[]} pointZones - Active point zones
 */
export function generateIntents(team, opponent, players, pointZones) {
  let intents = [];
  let myPlayers = players.filter(p => p.teamId === team.id);
  
  if (pointZones.length === 0) return intents;
  
  let target = pointZones[0];
  
  for (let player of myPlayers) {
    let targetX = player.x;
    let targetY = player.y;

    if (target.x > player.x) targetX++;
    else if (target.x < player.x) targetX--;
    else if (target.y > player.y) targetY++;
    else if (target.y < player.y) targetY--;

    intents.push({ playerId: player.id, x: targetX, y: targetY });
  }

  return intents;
}`);

  let awayCode = $state(form?.awayCode ?? `/**
 * Team: Beige
 */
export function generateIntents(team, opponent, players, pointZones) {
  let intents = [];
  // Add your logic here!
  return intents;
}`);

  function createEditor(node: HTMLElement, { value, onUpdate }: { value: string, onUpdate: (v: string) => void }) {
    const view = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        javascript({ typescript: true }),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onUpdate(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": { height: "100%", fontSize: "14px" },
          ".cm-scroller": { overflow: "auto" }
        })
      ],
      parent: node
    });

    return {
      destroy() {
        view.destroy();
      }
    };
  }

  let controlStats = $derived.by(() => {
    let currentTick = game.ticks[tick];
    if (!currentTick) return { left: 0, right: 0, none: 100, map: [] };

    let left = 0;
    let right = 0;
    let none = 0;
    let map: { x: number; y: number; color: string }[] = [];

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        let control: { color: string | undefined; distance: number | undefined } = { color: undefined, distance: undefined };

        for (let player of currentTick.players) {
          let team = currentTick.awayTeam.id === player.teamId ? currentTick.awayTeam : currentTick.homeTeam;
          let distance = Math.abs(player.x - x) + Math.abs(player.y - y);

          if (control.distance === undefined || distance < control.distance) {
            control.color = team.color;
            control.distance = distance;
          } else if (distance === control.distance && control.color !== team.color) {
            control.color = undefined;
          }
        }

        if (control.color === currentTick.homeTeam.color) left++;
        else if (control.color === currentTick.awayTeam.color) right++;
        else none++;

        if (control.color) map.push({ x, y, color: control.color });
      }
    }
    return { left, right, none, map };
  });

  $effect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        if (tick < game.ticks.length - 1) {
          tick++;
        } else {
          isPlaying = false;
        }
      }, playbackSpeed);
      return () => clearInterval(interval);
    }
  });

  $effect(() => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentTick = game.ticks[tick];
    if (!currentTick) return;

    ctx.clearRect(0, 0, width, height);

    // Draw grid control heatmap
    for (let square of controlStats.map) {
      ctx.fillStyle = hexToRgba(square.color, 0.15);
      ctx.fillRect(square.x * cellSize, square.y * cellSize, cellSize, cellSize);
    }

    // Draw grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= gridSize; i++) {
      ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, height);
      ctx.moveTo(0, i * cellSize); ctx.lineTo(width, i * cellSize);
    }
    ctx.stroke();

    // Draw point zones
    currentTick.pointZones.forEach(pz => {
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#EFBF04";
      ctx.fillStyle = "#EFBF04";
      ctx.fillRect(pz.x * cellSize + cellSize*0.25, pz.y * cellSize + cellSize*0.25, cellSize*0.5, cellSize*0.5);
      ctx.shadowBlur = 0;
    });

    // Draw players
    currentTick.players.forEach(p => {
      let team = currentTick.awayTeam.id === p.teamId ? currentTick.awayTeam : currentTick.homeTeam;
      ctx.beginPath();
      ctx.fillStyle = team.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = team.color;
      ctx.arc(p.x * cellSize + (cellSize / 2), p.y * cellSize + (cellSize / 2), cellSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Label
      ctx.fillStyle = "white";
      ctx.font = "10px Inter";
      ctx.textAlign = "center";
      ctx.fillText(p.name[0], p.x * cellSize + (cellSize / 2), p.y * cellSize + (cellSize / 2) + 4);
    });
  });

  function hexToRgba(hex: string, opacity: number) {
    let c = hex.substring(1).split("");
    if (c.length == 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    const num = parseInt(c.join(""), 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${opacity})`;
  }
</script>

<div class="h-screen flex bg-[#0a0a0c] text-slate-200 overflow-hidden font-sans">
  <!-- Left Side: Tabs and Code -->
  <div class="w-1/2 flex flex-col border-r border-slate-800/50 bg-[#0d0d11]">
    <div class="flex border-b border-slate-800/50 p-2 bg-[#121218]">
      <button 
        class="px-4 py-2 rounded-lg text-sm transition-colors {activeTab === 'info' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}"
        onclick={() => activeTab = 'info'}
      >
        Game Info
      </button>
      <button 
        class="px-4 py-2 rounded-lg text-sm transition-colors {activeTab === 'home' ? 'bg-amber-900/30 text-amber-400' : 'text-slate-400 hover:text-slate-200'}"
        onclick={() => activeTab = 'home'}
      >
        Home Logic
      </button>
      <button 
        class="px-4 py-2 rounded-lg text-sm transition-colors {activeTab === 'away' ? 'bg-blue-900/30 text-blue-400' : 'text-slate-400 hover:text-slate-200'}"
        onclick={() => activeTab = 'away'}
      >
        Away Logic
      </button>
      
      <div class="ml-auto">
        <form method="POST" use:enhance>
          <input type="hidden" name="homeCode" value={homeCode} />
          <input type="hidden" name="awayCode" value={awayCode} />
          <button class="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
            Run Simulation
          </button>
        </form>
      </div>
    </div>

    <div class="flex-grow relative overflow-hidden">
      {#if activeTab === 'info'}
        <div class="p-6 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-[#16161e] p-4 rounded-xl border border-slate-800">
              <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Home Team</div>
              <div class="text-2xl font-bold" style="color: {game.ticks[tick].homeTeam.color}">{game.ticks[tick].homeTeam.name}</div>
              <div class="text-4xl font-black mt-2">{game.ticks[tick].homeTeam.score}</div>
            </div>
            <div class="bg-[#16161e] p-4 rounded-xl border border-slate-800">
              <div class="text-xs text-slate-500 uppercase tracking-widest mb-1">Away Team</div>
              <div class="text-2xl font-bold" style="color: {game.ticks[tick].awayTeam.color}">{game.ticks[tick].awayTeam.name}</div>
              <div class="text-4xl font-black mt-2">{game.ticks[tick].awayTeam.score}</div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-sm mb-2">
              <span class="text-slate-400">Field Control</span>
            </div>
            <div class="flex h-4 w-full rounded-full overflow-hidden bg-slate-800 border border-slate-700">
              <div class="h-full transition-all duration-500" style="width: {controlStats.left}%; background-color: {game.ticks[tick].homeTeam.color};"></div>
              <div class="h-full bg-transparent" style="width: {controlStats.none}%;"></div>
              <div class="h-full transition-all duration-500" style="width: {controlStats.right}%; background-color: {game.ticks[tick].awayTeam.color};"></div>
            </div>
            <div class="flex justify-between text-[10px] mt-1 text-slate-500 font-mono">
              <span>{controlStats.left}%</span>
              <span>UNCONTROLLED</span>
              <span>{controlStats.right}%</span>
            </div>
          </div>

          <div class="bg-[#16161e] p-6 rounded-xl border border-slate-800">
            <h3 class="text-slate-400 text-xs uppercase tracking-widest mb-4">Players</h3>
            <div class="space-y-4">
              {#each game.ticks[tick].players as p}
                <div class="flex items-center gap-3">
                  <div class="w-2 h-2 rounded-full" style="background-color: {game.ticks[tick].awayTeam.id === p.teamId ? game.ticks[tick].awayTeam.color : game.ticks[tick].homeTeam.color}"></div>
                  <span class="text-sm font-medium">{p.name}</span>
                  <span class="ml-auto text-xs text-slate-500 font-mono">[{p.x}, {p.y}]</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {:else if activeTab === 'home'}
        <div class="h-full w-full" use:createEditor={{ value: homeCode, onUpdate: (v) => homeCode = v }}></div>
      {:else if activeTab === 'away'}
        <div class="h-full w-full" use:createEditor={{ value: awayCode, onUpdate: (v) => awayCode = v }}></div>
      {/if}
    </div>
  </div>

  <!-- Right Side: Viewer and Controls -->
  <div class="w-1/2 flex flex-col items-center justify-center p-8 bg-[#0a0a0c]">
    <div class="relative group">
      <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      <canvas 
        bind:this={canvas} 
        {width} 
        {height} 
        class="relative bg-[#0d0d11] rounded-lg border border-slate-800 shadow-2xl"
      ></canvas>
    </div>

    <div class="mt-12 w-full max-w-xl space-y-6">
      <div class="flex items-center gap-6">
        <button 
          class="p-2 text-slate-400 hover:text-white transition-colors"
          onclick={() => tick = Math.max(0, tick - 1)}
          aria-label="Previous Tick"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
        </button>

        <button 
          class="w-16 h-16 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
          onclick={() => isPlaying = !isPlaying}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {#if isPlaying}
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" class="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          {/if}
        </button>

        <button 
          class="p-2 text-slate-400 hover:text-white transition-colors"
          onclick={() => tick = Math.min(game.ticks.length - 1, tick + 1)}
          aria-label="Next Tick"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
        </button>

        <div class="flex-grow flex flex-col gap-1">
          <div class="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>TICK {tick}</span>
            <span>{game.ticks.length} TOTAL</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max={game.ticks.length - 1} 
            bind:value={tick}
            class="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      <div class="flex justify-center gap-4">
        {#each [2000, 1000, 500, 200] as speed}
          <button 
            class="text-[10px] px-3 py-1 rounded border border-slate-800 transition-colors {playbackSpeed === speed ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' : 'text-slate-500 hover:border-slate-700'}"
            onclick={() => playbackSpeed = speed}
          >
            {speed === 2000 ? '0.5x' : speed === 1000 ? '1x' : speed === 500 ? '2x' : '5x'}
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  :global(.cm-editor) {
    height: 100%;
  }
  :global(.cm-scroller) {
    font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
  }
  
  /* Custom Range Input Styling for a more premium look */
  input[type=range]::-webkit-slider-thumb {
    appearance: none;
    height: 12px;
    width: 12px;
    border-radius: 99px;
    background: #6366f1;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
  }
</style>

