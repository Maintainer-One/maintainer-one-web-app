<script lang="ts">
  import type { PageProps } from "./$types";
  import { onMount } from "svelte";
  import { EditorView, basicSetup } from "codemirror";
  import { javascript } from "@codemirror/lang-javascript";
  import { oneDark } from "@codemirror/theme-one-dark";
  import { transform } from "sucrase";
  import { runGame } from "$lib/sim/v1sim";
  import { generateGameRecap } from "$lib/sim/AnalyticsUtils";
  import { supabase } from "$lib/supabaseClient";

  let { data, form }: PageProps = $props();
  
  // Local state for the game replay to allow client-side updates
  let game = $state(form?.game ?? data.game);
  let isSimulating = $state(false);
  let session = $state<import('@supabase/supabase-js').Session | null>(null);

  // Analytics
  let recap = $derived(generateGameRecap(game));

  let canvas: HTMLCanvasElement;
  let width = 600;
  let height = 600;
  const gridSize = 10;
  let cellSize = $derived(width / gridSize);

  let tick = $state(0);
  let isPlaying = $state(false);
  let playbackSpeed = $state(1000); // ms per tick (1x = 1s)

  let activeTab = $state("info"); // "info" | "home" | "away"

  let homeCode = $state(form?.homeCode ?? `// Team: Amber
// You can now use TypeScript!

export function generateIntents(team: any, opponent: any, players: any[], pointZones: any[]): any[] {
  let intents: any[] = [];
  let myPlayers = players.filter(p => p.teamId === team.id);
  
  if (pointZones.length === 0) return intents;
  
  let target = pointZones[0];
  
  for (let player of myPlayers) {
    let targetX = player.x;
    let targetY = player.y;

    if (target.x > player.x) targetX++;
    else if (target.x < player.x) targetY++; // Simple move logic
    
    intents.push({ playerId: player.id, x: targetX, y: targetY });
  }

  return intents;
}`);

  let awayCode = $state(form?.awayCode ?? `// Team: Beige
// Run the simulation locally for instant feedback!

export function generateIntents(team: any, opponent: any, players: any[], pointZones: any[]): any[] {
  let intents: any[] = [];
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

  async function runSimulation(e?: Event) {
    if (e) e.preventDefault();
    isSimulating = true;
    
    try {
      // Transpile TS to JS locally using sucrase
      const homeJS = transform(homeCode, { transforms: ["typescript"] }).code;
      const awayJS = transform(awayCode, { transforms: ["typescript"] }).code;

      // Run simulation directly in the browser
      const newGame = await runGame("Amber", "Beige", homeJS, awayJS);
      
      // Update state immediately without page refresh
      game = newGame;
      tick = 0;
      isPlaying = true;
      controlCache.clear();
    } catch (err) {
      console.error("Local simulation failed:", err);
      // Fallback: if local fails, the form submit might still work or we show an error
    } finally {
      isSimulating = false;
    }
  }

  // Cache for grid control states to make interpolation smooth
  let controlCache = new Map<number, {
    left: number, 
    right: number, 
    none: number, 
    grid: (string | null)[][]
  }>();

  function calculateControl(tickIdx: number) {
    if (controlCache.has(tickIdx)) return controlCache.get(tickIdx)!;
    
    const currentTick = game.ticks[tickIdx];
    if (!currentTick) return { left: 0, right: 0, none: 100, grid: [] };

    let left = 0;
    let right = 0;
    let none = 0;
    let grid: (string | null)[][] = [];

    for (let x = 0; x < gridSize; x++) {
      grid[x] = [];
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

        grid[x][y] = control.color || null;
        if (control.color === currentTick.homeTeam.color) left++;
        else if (control.color === currentTick.awayTeam.color) right++;
        else none++;
      }
    }
    
    const result = { left, right, none, grid };
    controlCache.set(tickIdx, result);
    return result;
  }

  let controlStats = $derived(calculateControl(tick));

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

  let pings = $state<{x: number, y: number, color: string, radius: number, opacity: number}[]>([]);
  let tickStartTime = $state(Date.now());

  function triggerPing(x: number, y: number, color: string) {
    pings.push({ 
      x: x * cellSize + cellSize / 2, 
      y: y * cellSize + cellSize / 2, 
      color, 
      radius: cellSize / 2, 
      opacity: 1 
    });
  }

  // Track tick transitions for interpolation
  let prevTickIndex = -1;
  $effect(() => {
    if (tick === prevTickIndex) return;
    tickStartTime = Date.now();
    
    const currentTick = game.ticks[tick];
    const prevTickSnapshot = prevTickIndex >= 0 ? game.ticks[prevTickIndex] : null;
    
    if (prevTickSnapshot && tick > prevTickIndex) {
      if (currentTick.homeTeam.score > prevTickSnapshot.homeTeam.score) {
        const captured = prevTickSnapshot.pointZones.find(pz => !currentTick.pointZones.some(cz => cz.x === pz.x && cz.y === pz.y));
        if (captured) triggerPing(captured.x, captured.y, currentTick.homeTeam.color);
      }
      if (currentTick.awayTeam.score > prevTickSnapshot.awayTeam.score) {
        const captured = prevTickSnapshot.pointZones.find(pz => !currentTick.pointZones.some(cz => cz.x === pz.x && cz.y === pz.y));
        if (captured) triggerPing(captured.x, captured.y, currentTick.awayTeam.color);
      }
    }
    prevTickIndex = tick;
  });

  onMount(() => {
    // Auth check
    (async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      session = currentSession;
    })();

    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame: number;
    const render = () => {
      // 1. UPDATE ANIMATION STATE
      pings = pings
        .map(p => ({ ...p, radius: p.radius + 1.5, opacity: p.opacity - 0.02 }))
        .filter(p => p.opacity > 0);

      const now = Date.now();
      let progress = isPlaying ? Math.min(1, (now - tickStartTime) / playbackSpeed) : 1;

      // 2. CLEAR CANVAS
      ctx.clearRect(0, 0, width, height);

      const currentTick = game.ticks[tick];
      const prevTick = tick > 0 ? game.ticks[tick - 1] : currentTick;

      // 3. DRAW GRID & HEATMAP (Interpolated)
      const prevControl = calculateControl(tick > 0 ? tick - 1 : tick);
      const currControl = controlStats;

      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          const prevColor = prevControl.grid[x][y];
          const currColor = currControl.grid[x][y];

          if (prevColor === currColor) {
            if (currColor) {
              ctx.fillStyle = hexToRgba(currColor, 0.15);
              ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
          } else {
            if (prevColor) {
              ctx.fillStyle = hexToRgba(prevColor, 0.15 * (1 - progress));
              ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
            if (currColor) {
              ctx.fillStyle = hexToRgba(currColor, 0.15 * progress);
              ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
          }
        }
      }

      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= gridSize; i++) {
        ctx.moveTo(i * cellSize, 0); ctx.lineTo(i * cellSize, height);
        ctx.moveTo(0, i * cellSize); ctx.lineTo(width, i * cellSize);
      }
      ctx.stroke();

      // 4. DRAW POINT ZONES (with spawn animation)
      currentTick.pointZones.forEach(pz => {
        const wasPresent = prevTick.pointZones.some(opz => opz.x === pz.x && opz.y === pz.y);
        const scale = wasPresent ? 1 : progress;
        const opacity = wasPresent ? 1 : progress;

        ctx.save();
        ctx.translate(pz.x * cellSize + cellSize / 2, pz.y * cellSize + cellSize / 2);
        ctx.scale(scale, scale);
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(239, 191, 4, ${opacity})`;
        ctx.fillStyle = `rgba(239, 191, 4, ${opacity})`;
        ctx.fillRect(-cellSize * 0.25, -cellSize * 0.25, cellSize * 0.5, cellSize * 0.5);
        ctx.restore();
      });

      // 5. DRAW PINGS
      pings.forEach(p => {
        ctx.beginPath();
        ctx.strokeStyle = hexToRgba(p.color, p.opacity);
        ctx.lineWidth = 4;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.strokeStyle = hexToRgba(p.color, p.opacity * 0.5);
        ctx.lineWidth = 2;
        ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 6. DRAW TRAILS & INTENTS
      currentTick.players.forEach(p => {
        const prevP = prevTick.players.find(pp => pp.id === p.id) || p;
        const interpX = prevP.x + (p.x - prevP.x) * progress;
        const interpY = prevP.y + (p.y - prevP.y) * progress;
        const team = currentTick.awayTeam.id === p.teamId ? currentTick.awayTeam : currentTick.homeTeam;

        const centerX = interpX * cellSize + cellSize / 2;
        const centerY = interpY * cellSize + cellSize / 2;
        const startX = prevP.x * cellSize + cellSize / 2;
        const startY = prevP.y * cellSize + cellSize / 2;

        // Trail (Where they came from this tick)
        if (startX !== centerX || startY !== centerY) {
          ctx.beginPath();
          ctx.strokeStyle = hexToRgba(team.color, 0.2);
          ctx.lineWidth = 3;
          ctx.moveTo(startX, startY);
          ctx.lineTo(centerX, centerY);
          ctx.stroke();
        }

        // Intent (Where they want to go)
        if (p.intentX !== undefined && p.intentY !== undefined && p.intentStatus !== 'none') {
          const targetX = p.intentX * cellSize + cellSize / 2;
          const targetY = p.intentY * cellSize + cellSize / 2;

          if (targetX !== centerX || targetY !== centerY) {
            let color = team.color;
            let opacity = 0.4;
            let dash = [4, 4];

            if (p.intentStatus === 'illegal') {
              color = "#ff4444";
              opacity = 0.8;
              dash = []; // Solid for illegal
            } else if (p.intentStatus === 'collision') {
              color = "#ffaa00";
              opacity = 0.7;
            }

            ctx.beginPath();
            ctx.setLineDash(dash);
            ctx.strokeStyle = hexToRgba(color, opacity);
            ctx.lineWidth = p.intentStatus === 'illegal' ? 3 : 2;
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(targetX, targetY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrowhead
            const angle = Math.atan2(targetY - centerY, targetX - centerX);
            ctx.beginPath();
            ctx.fillStyle = hexToRgba(color, opacity + 0.2);
            ctx.moveTo(targetX, targetY);
            ctx.lineTo(targetX - 8 * Math.cos(angle - Math.PI / 8), targetY - 8 * Math.sin(angle - Math.PI / 8));
            ctx.lineTo(targetX - 8 * Math.cos(angle + Math.PI / 8), targetY - 8 * Math.sin(angle + Math.PI / 8));
            ctx.fill();

            // Collision Indicator
            if (p.intentStatus === 'collision' && progress > 0.5) {
              ctx.beginPath();
              ctx.fillStyle = "#ffaa00";
              ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Illegal Indicator
            if (p.intentStatus === 'illegal') {
              ctx.font = "bold 14px Inter";
              ctx.fillStyle = "#ff4444";
              ctx.textAlign = "center";
              ctx.fillText("!", targetX, targetY - 10);
            }
          }
        }
      });

      // 7. DRAW PLAYERS (interpolated)
      currentTick.players.forEach(p => {
        const prevP = prevTick.players.find(pp => pp.id === p.id) || p;
        const interpX = prevP.x + (p.x - prevP.x) * progress;
        const interpY = prevP.y + (p.y - prevP.y) * progress;
        
        const team = currentTick.awayTeam.id === p.teamId ? currentTick.awayTeam : currentTick.homeTeam;
        ctx.beginPath();
        ctx.fillStyle = team.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = team.color;
        ctx.arc(interpX * cellSize + (cellSize / 2), interpY * cellSize + (cellSize / 2), cellSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = "white";
        ctx.font = "10px Inter";
        ctx.textAlign = "center";
        ctx.fillText(p.name[0], interpX * cellSize + (cellSize / 2), interpY * cellSize + (cellSize / 2) + 4);
      });

      frame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frame);
  });

  function hexToRgba(hex: string, opacity: number) {
    let c = hex.substring(1).split("");
    if (c.length == 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    const num = parseInt(c.join(""), 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${opacity})`;
  }
</script>

<svelte:head>
  <title>Logic Trial | Maintainer One</title>
</svelte:head>

<div class="max-w-7xl mx-auto space-y-6 flex flex-col h-[calc(100vh-2rem)] py-4 font-mono text-gray-400">
  <header class="flex justify-between items-end border-b border-gray-800 pb-4">
    <a class="group hover:opacity-80 transition-opacity" href="/">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-red-600 flex items-center justify-center font-bold text-black text-xl">M1</div>
        <div>
          <h1 class="text-2xl font-bold tracking-tighter text-white uppercase">
            Logic Trial
          </h1>
          <p class="text-[8px] text-gray-500 uppercase tracking-widest">Maintainer One Protocol Alpha</p>
        </div>
      </div>
    </a>
    
    <div class="flex gap-6 items-center">
      {#if session}
        <nav class="hidden md:flex gap-4 text-[10px] uppercase tracking-widest text-gray-500">
          <a class="hover:text-stone-200 transition-colors" href="/dashboard">Dashboard</a>
          <a class="hover:text-stone-200 transition-colors" href="/sandbox">Sandbox</a>
        </nav>
      {:else}
        <a class="text-[10px] uppercase tracking-widest text-gray-600 hover:text-stone-400 transition-colors" href="/">Return to Home</a>
      {/if}

      <div class="flex gap-4 items-center bg-gray-900/40 p-2 border border-gray-800">
        <button 
          class="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/50 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
          disabled={isSimulating}
          onclick={runSimulation}
        >
          {#if isSimulating}
            <svg class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
            </svg>
            Processing...
          {:else}
            Execute Logic
          {/if}
        </button>
      </div>
    </div>
  </header>

  <div class="grid grid-cols-12 gap-6 grow overflow-hidden">
    <!-- Left Column: Code Logic -->
    <div class="col-span-4 flex flex-col gap-4 overflow-hidden">
      <div class="grow flex flex-col border border-gray-800 bg-gray-900/20 overflow-hidden">
        <div class="flex border-b border-gray-800 bg-black/20">
          <button 
            class="px-4 py-2 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-colors {activeTab === 'home' ? 'border-red-600 text-white' : 'border-transparent text-gray-500 hover:text-stone-300'}"
            onclick={() => activeTab = 'home'}
          >
            Home Logic
          </button>
          <button 
            class="px-4 py-2 text-[10px] uppercase tracking-widest font-bold border-b-2 transition-colors {activeTab === 'away' ? 'border-red-600 text-white' : 'border-transparent text-gray-500 hover:text-stone-300'}"
            onclick={() => activeTab = 'away'}
          >
            Away Logic
          </button>
        </div>
        
        <div class="grow overflow-hidden relative">
          {#if activeTab === 'home'}
            <div class="h-full w-full" use:createEditor={{ value: homeCode, onUpdate: (v) => homeCode = v }}></div>
          {:else if activeTab === 'away'}
            <div class="h-full w-full" use:createEditor={{ value: awayCode, onUpdate: (v) => awayCode = v }}></div>
          {/if}
        </div>
      </div>

      <div class="p-4 border border-gray-800 bg-gray-900/10">
        <h3 class="text-[10px] uppercase tracking-widest text-gray-600 mb-2">Team Parameters</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="p-2 border border-gray-800 bg-black/40">
            <div class="text-[8px] text-gray-600 uppercase mb-1">Home Team</div>
            <div class="text-xs font-bold text-stone-300">{game.ticks[tick].homeTeam.name}</div>
          </div>
          <div class="p-2 border border-gray-800 bg-black/40">
            <div class="text-[8px] text-gray-600 uppercase mb-1">Away Team</div>
            <div class="text-xs font-bold text-stone-300">{game.ticks[tick].awayTeam.name}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Column: Viewer -->
    <div class="col-span-5 flex flex-col items-center justify-center p-4 bg-black/40 border border-gray-800 relative">
      <div class="relative group">
        <div class="absolute -inset-1 bg-red-600/10 rounded-lg blur-sm opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <canvas 
          class="relative bg-[#050505] shadow-2xl border border-gray-900 rounded-sm" 
          bind:this={canvas} 
          {height}
          {width}
        ></canvas>
      </div>

      <div class="mt-8 w-full px-4 space-y-4">
        <div class="flex items-center gap-4">
          <button 
            class="p-2 bg-white text-black rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg"
            aria-label={isPlaying ? "Pause" : "Play"}
            onclick={() => isPlaying = !isPlaying} 
          >
            {#if isPlaying}
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>
            {:else}
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            {/if}
          </button>
          
          <div class="grow flex flex-col gap-1">
            <div class="flex justify-between text-[10px] text-gray-600 font-mono">
              <span>TICK {tick}</span>
              <span>{game.ticks.length} TOTAL</span>
            </div>
            <input 
              class="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-red-600" 
              bind:value={tick} 
              max={game.ticks.length - 1} 
              min="0" 
              type="range" 
            />
          </div>
        </div>

        <div class="flex justify-center gap-2">
          {#each [2000, 1000, 500, 200] as speed}
            <button 
              class="text-[9px] px-2 py-0.5 rounded border transition-colors uppercase tracking-tighter {playbackSpeed === speed ? 'bg-red-900/20 border-red-500/50 text-red-500' : 'border-gray-800 text-gray-600 hover:border-gray-700'}"
              onclick={() => playbackSpeed = speed}
            >
              {speed === 2000 ? '0.5x' : speed === 1000 ? '1x' : speed === 500 ? '2x' : '5x'}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Right Column: Metrics -->
    <div class="col-span-3 flex flex-col gap-4">
      <div class="p-6 border border-gray-800 bg-gray-900/30">
        <h3 class="text-[10px] uppercase tracking-widest text-gray-600 mb-4 border-b border-gray-800 pb-2">Real-time Metrics</h3>
        <div class="space-y-6">
          <div>
            <div class="flex justify-between text-[10px] uppercase mb-1">
              <span class="text-stone-300">Field Control</span>
            </div>
            <div class="h-1 w-full bg-gray-800 flex rounded-full overflow-hidden">
              <div class="h-full transition-all duration-500" style="width: {controlStats.left}%; background-color: {game.ticks[tick].homeTeam.color};"></div>
              <div class="h-full transition-all duration-500" style="width: {controlStats.right}%; background-color: {game.ticks[tick].awayTeam.color};"></div>
            </div>
            <div class="flex justify-between text-[8px] mt-1 text-gray-600 font-mono">
              <span>{controlStats.left}%</span>
              <span>{controlStats.right}%</span>
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

          <div class="space-y-2 pt-2 border-t border-gray-800/50">
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-gray-500 uppercase tracking-tighter">Expected Captures</span>
              <span class="text-stone-300 font-mono">{recap.home.expectedCaptures}</span>
            </div>
            <div class="flex justify-between items-center text-[10px]">
              <span class="text-gray-500 uppercase tracking-tighter">Stolen Captures</span>
              <span class="text-red-500 font-mono">{recap.home.stolenCaptures}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="grow p-6 border border-gray-800 bg-gray-900/10">
        <h3 class="text-[10px] uppercase tracking-widest text-gray-600 mb-4 border-b border-gray-800 pb-2">Active Entities</h3>
        <div class="space-y-3">
          {#each game.ticks[tick].players as p}
            <div class="flex items-center gap-2">
              <div class="w-1 h-3 rounded-full" style="background-color: {game.ticks[tick].awayTeam.id === p.teamId ? game.ticks[tick].awayTeam.color : game.ticks[tick].homeTeam.color}"></div>
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{p.name}</span>
              <span class="ml-auto text-[10px] text-gray-600 font-mono">[{p.x},{p.y}]</span>
            </div>
          {/each}
        </div>
        
        <div class="mt-8">
          <p class="text-[10px] text-gray-700 italic border-l border-gray-800 pl-2">Evaluation mode active. Real-time telemetry streaming from protocol alpha nodes...</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #050505;
    background-image: 
      radial-gradient(circle at 50% 50%, rgba(20, 20, 25, 1) 0%, rgba(5, 5, 5, 1) 100%),
      linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 100% 100%, 30px 30px, 30px 30px;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #222;
    border-radius: 10px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #333;
  }

  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
    border: 2px solid #dc2626;
  }

  :global(.cm-editor) {
    height: 100%;
    font-size: 12px;
    background-color: transparent !important;
  }

  :global(.cm-scroller) {
    font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
  }
</style>

