<script lang="ts">
  import type { PageProps } from "./$types";
  import { onMount } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { javascript } from "@codemirror/lang-javascript";
  import { oneDark } from "@codemirror/theme-one-dark";
  import { transform } from "sucrase";
  import { runGame } from "$lib/sim/v1sim";
  import { generateGameRecap } from "$lib/sim/AnalyticsUtils";

  let { data }: PageProps = $props();
  
  // Simulation State
  let game = $state(data.game);
  let isSimulating = $state(false);
  let tick = $state(0);
  let isPlaying = $state(false);
  let playbackSpeed = $state(500);
  let seedInput = $state("1067780");
  let homeTeamSelect = $state("Amber");
  let awayTeamSelect = $state("Beige");

  // Analytics
  let recap = $derived(generateGameRecap(game));

  // Canvas View
  let canvas: HTMLCanvasElement;
  const width = 600;
  const height = 600;
  const gridSize = 10;
  const cellSize = width / gridSize;

  let homeCode = $state(`// Team: Amber\nexport function generateIntents(team, opponent, players, pointZones) {\n  let intents = [];\n  let myPlayers = players.filter(p => p.teamId === team.id);\n  if (pointZones.length === 0) return intents;\n  let target = pointZones[0];\n  for (let player of myPlayers) {\n    let targetX = player.x;\n    let targetY = player.y;\n    if (target.x > player.x) targetX++;\n    else if (target.x < player.x) targetX--;\n    else if (target.y > player.y) targetY++;\n    else if (target.y < player.y) targetY--;\n    intents.push({ playerId: player.id, x: targetX, y: targetY });\n  }\n  return intents;\n}`);

  let awayCode = $state(`// Team: Beige\nexport function generateIntents(team, opponent, players, pointZones) {\n  return [];\n}`);

  function createEditor(node: HTMLElement, { value, onUpdate }: { value: string, onUpdate: (v: string) => void }) {
    const view = new EditorView({
      doc: value,
      extensions: [
        basicSetup,
        javascript({ typescript: true }),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onUpdate(update.state.doc.toString());
        }),
        EditorView.theme({ "&": { height: "100%", fontSize: "14px" } })
      ],
      parent: node
    });
    return { destroy() { view.destroy(); } };
  }

  async function runSimulation() {
    isSimulating = true;
    try {
      const homeJS = transform(homeCode, { transforms: ["typescript"] }).code;
      const awayJS = transform(awayCode, { transforms: ["typescript"] }).code;
      const seed = BigInt(seedInput);
      game = await runGame(homeTeamSelect, awayTeamSelect, homeJS, awayJS, seed);
      tick = 0;
      isPlaying = true;
    } catch (err) {
      console.error("Sandbox simulation failed:", err);
    } finally {
      isSimulating = false;
    }
  }

  $effect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        if (tick < game.ticks.length - 1) tick++;
        else isPlaying = false;
      }, playbackSpeed);
      return () => clearInterval(interval);
    }
  });

  // Canvas Rendering Logic (Simplified for brevity but functional)
  onMount(() => {
     const ctx = canvas.getContext("2d");
     if (!ctx) return;
     let frame: number;
     const render = () => {
       ctx.clearRect(0, 0, width, height);
       const currentTick = game.ticks[tick];
       
       // Draw Grid
       ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
       for (let i = 0; i <= gridSize; i++) {
         ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, height);
         ctx.moveTo(0, i * cellSize); ctx.lineTo(width, i * cellSize);
       }
       ctx.stroke();

       // Draw Zones
       currentTick.pointZones.forEach(pz => {
         ctx.fillStyle = "#eab308";
         ctx.fillRect(pz.x * cellSize + cellSize*0.25, pz.y * cellSize + cellSize*0.25, cellSize*0.5, cellSize*0.5);
       });

       // Draw Players
       currentTick.players.forEach(p => {
         ctx.fillStyle = game.ticks[tick].homeTeam.id === p.teamId ? game.ticks[tick].homeTeam.color || "#dc2626" : game.ticks[tick].awayTeam.color || "#2563eb";
         ctx.beginPath();
         ctx.arc(p.x * cellSize + cellSize/2, p.y * cellSize + cellSize/2, cellSize*0.3, 0, Math.PI*2);
         ctx.fill();
       });

       frame = requestAnimationFrame(render);
     };
     render();
     return () => cancelAnimationFrame(frame);
  });
</script>

<svelte:head>
  <title>Sandbox | Maintainer One</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6 flex flex-col h-[calc(100vh-8rem)]">
  <header class="flex justify-between items-end border-b border-gray-800 pb-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tighter text-white uppercase border-l-4 border-red-600 pl-4">
        Logic Sandbox
      </h1>
      <p class="text-xs text-gray-500 mt-2 uppercase tracking-widest">Protocol Alpha Development Environment</p>
    </div>
    
    <div class="flex gap-4 items-center bg-gray-900/40 p-2 border border-gray-800">
      <div class="flex flex-col">
        <label class="text-[10px] uppercase text-gray-600 mb-1" for="seed">PRNG Seed</label>
        <input id="seed" bind:value={seedInput} class="bg-black border border-gray-700 text-xs px-2 py-1 w-32 font-mono text-stone-300 focus:border-red-500 outline-none" />
      </div>
      <button 
        onclick={runSimulation}
        disabled={isSimulating}
        class="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
      >
        {isSimulating ? 'Processing...' : 'Execute Logic'}
      </button>
    </div>
  </header>

  <div class="grid grid-cols-12 gap-6 flex-grow overflow-hidden">
    <!-- Left: Code and Config -->
    <div class="col-span-4 flex flex-col gap-4 overflow-hidden">
      <div class="flex-grow flex flex-col border border-gray-800 bg-gray-900/20 overflow-hidden">
        <div class="flex border-b border-gray-800">
          <button class="px-4 py-2 text-[10px] uppercase tracking-widest font-bold border-b-2 border-red-600">Home Logic</button>
          <button class="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-500 hover:text-stone-300">Away Logic</button>
        </div>
        <div class="flex-grow overflow-hidden" use:createEditor={{ value: homeCode, onUpdate: (v) => homeCode = v }}></div>
      </div>

      <div class="p-4 border border-gray-800 bg-gray-900/10 space-y-4">
         <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] uppercase text-gray-600 block mb-1" for="homeTeam">Home Team</label>
              <select id="homeTeam" bind:value={homeTeamSelect} class="w-full bg-black border border-gray-800 text-xs p-1 text-gray-400">
                {#each data.defaultTeams as team}
                  <option value={team}>{team}</option>
                {/each}
              </select>
            </div>
            <div>
              <label class="text-[10px] uppercase text-gray-600 block mb-1" for="awayTeam">Away Team</label>
              <select id="awayTeam" bind:value={awayTeamSelect} class="w-full bg-black border border-gray-800 text-xs p-1 text-gray-400">
                {#each data.defaultTeams as team}
                  <option value={team}>{team}</option>
                {/each}
              </select>
            </div>
         </div>
      </div>
    </div>

    <!-- Middle: Viewer -->
    <div class="col-span-5 flex flex-col items-center justify-center p-4 bg-black/40 border border-gray-800 relative">
      <canvas bind:this={canvas} {width} {height} class="bg-[#050505] shadow-2xl border border-gray-900"></canvas>
      
      <div class="mt-8 w-full px-8 space-y-4">
         <div class="flex items-center gap-4">
            <button onclick={() => isPlaying = !isPlaying} class="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform">
               {#if isPlaying}
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
               {:else}
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
               {/if}
            </button>
            <input type="range" bind:value={tick} max={game.ticks.length-1} min="0" class="flex-grow accent-red-600 h-1" />
            <span class="text-[10px] font-mono text-gray-600">TICK {tick}</span>
         </div>
      </div>
    </div>

    <!-- Right: Metrics -->
    <div class="col-span-3 flex flex-col gap-4">
      <div class="p-6 border border-gray-800 bg-gray-900/30">
        <h3 class="text-[10px] uppercase tracking-widest text-gray-600 mb-4 border-b border-gray-800 pb-2">Real-time Metrics</h3>
        <div class="space-y-6">
          <div>
            <div class="flex justify-between text-[10px] uppercase mb-1">
              <span class="text-stone-300">Field Control</span>
            </div>
            <div class="h-1 w-full bg-gray-800 flex">
              <div class="h-full bg-red-600" style="width: {game.ticks[tick].fieldControl?.home || 0}%"></div>
              <div class="h-full bg-blue-600" style="width: {game.ticks[tick].fieldControl?.away || 0}%"></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-black/40 border border-gray-800">
              <div class="text-[8px] text-gray-600 uppercase mb-1">Fortune Delta</div>
              <div class="text-xl font-bold font-mono {recap.home.fortune >= 0 ? 'text-green-500' : 'text-red-500'}">
                {recap.home.fortune >= 0 ? '+' : ''}{recap.home.fortune.toFixed(1)}
              </div>
            </div>
            <div class="p-3 bg-black/40 border border-gray-800">
              <div class="text-[8px] text-gray-600 uppercase mb-1">Avg Control</div>
              <div class="text-xl font-bold font-mono text-stone-200">{recap.home.controlAvg.toFixed(0)}%</div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-gray-500 uppercase tracking-tighter">Expected Captures</span>
              <span class="text-stone-300 font-mono">{recap.home.expectedCaptures}</span>
            </div>
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-gray-500 uppercase tracking-tighter">Stolen Captures</span>
              <span class="text-red-500 font-mono">{recap.home.stolenCaptures}</span>
            </div>
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-gray-500 uppercase tracking-tighter">Lifespan Despawns</span>
              <span class="text-orange-500 font-mono">{recap.home.despawns}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex-grow p-6 border border-gray-800 bg-gray-900/10">
        <h3 class="text-[10px] uppercase tracking-widest text-gray-600 mb-4 border-b border-gray-800 pb-2">Logic Audit</h3>
        <p class="text-[10px] text-gray-700 italic">Audit log initialized. Monitoring intents for illegal movement or collision thrashes...</p>
      </div>
    </div>
  </div>
</div>
