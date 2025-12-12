<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import logo from '$lib/assets/outlined-logo.svg';

  // --- STATE ---
  let timeLeft = $state({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  let scores = $state({ red: 0, gray: 0 });
  let hoveredBot = $state<any>(null);
  let canvas: HTMLCanvasElement;

  // TARGET DATE: Jan 1, 2026 (Local Time)
  const TARGET_DATE = new Date("2026-01-01T00:00:00").getTime();

  function updateTimer() {
    const now = new Date().getTime();
    const distance = TARGET_DATE - now;
    if (distance < 0) {
        timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return;
    }
    timeLeft = {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000),
    };
  }

  // --- ENGINE SIMULATION LOGIC ---
  function initSimulation() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const cellSize = 32;
    let mouseX = -100;
    let mouseY = -100;

    // --- ENTITIES ---
    interface Bot {
      id: string;
      team: 'red' | 'gray';
      prevX: number; prevY: number;
      nextX: number; nextY: number;
      intent: string;
    }

    interface Hotspot {
      x: number;
      y: number;
    }

    interface Explosion {
      x: number;
      y: number;
      age: number; // 0 to 1
      color: string;
    }

    const bots: Bot[] = [];
    let hotspot: Hotspot | null = null;
    let explosions: Explosion[] = [];

    const genId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

    // --- RESIZE & SPAWN ---
    const resize = () => {
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      bots.length = 0;
      const botCount = Math.floor((width * height) / 35000);
      const gridW = Math.ceil(width / cellSize);
      const gridH = Math.ceil(height / cellSize);

      for (let i = 0; i < botCount; i++) {
        const startX = Math.floor(Math.random() * gridW);
        const startY = Math.floor(Math.random() * gridH);
        bots.push({
          id: genId(),
          team: Math.random() > 0.5 ? 'red' : 'gray', // Even split for race
          prevX: startX, prevY: startY,
          nextX: startX, nextY: startY,
          intent: 'IDLE'
        });
      }
    };

    window.addEventListener('resize', resize);
    resize();

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    // --- GAME LOOP ---
    let tickProgress = 0;
    const tickDuration = 40; // Slightly faster for "Race" feel

    function draw() {
        if (!ctx) return;

        // 1. Clear & Draw Grid
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = "rgba(50, 50, 50, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x <= width; x += cellSize) {
            ctx.moveTo(x, 0); ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += cellSize) {
            ctx.moveTo(0, y); ctx.lineTo(width, y);
        }
        ctx.stroke();

        // 2. LOGIC UPDATE
        tickProgress++;
        if (tickProgress >= tickDuration) {
            tickProgress = 0;
            const gridW = Math.ceil(width / cellSize);
            const gridH = Math.ceil(height / cellSize);

            // A. Manage Hotspot
            if (!hotspot && Math.random() > 0.1) {
                hotspot = {
                    x: Math.floor(Math.random() * gridW),
                    y: Math.floor(Math.random() * gridH)
                };
            }

            // B. Determine Chasers (The "Closest" Logic)
            let chaserIds = new Set<string>();
            if (hotspot) {
                const distances = bots.map(b => ({
                    id: b.id,
                    dist: Math.abs(b.prevX - hotspot!.x) + Math.abs(b.prevY - hotspot!.y)
                }));
                distances.sort((a, b) => a.dist - b.dist);
                distances.slice(0, 4).forEach(d => chaserIds.add(d.id));
            }

            // C. Bot Movement
            const occupied = new Set<string>();
            bots.forEach(b => occupied.add(`${b.nextX},${b.nextY}`));

            bots.forEach(bot => {
                bot.prevX = bot.nextX;
                bot.prevY = bot.nextY;

                let dx = 0;
                let dy = 0;

                // Move Logic
                if (hotspot && chaserIds.has(bot.id)) {
                    bot.intent = 'RACING';
                    if (hotspot.x > bot.prevX) dx = 1;
                    else if (hotspot.x < bot.prevX) dx = -1;
                    else if (hotspot.y > bot.prevY) dy = 1;
                    else if (hotspot.y < bot.prevY) dy = -1;
                } else {
                    bot.intent = 'IDLE';
                    if (Math.random() > 0.3) {
                        const r = Math.floor(Math.random() * 4);
                        if (r === 0) dy = -1;
                        if (r === 1) dx = 1;
                        if (r === 2) dy = 1;
                        if (r === 3) dx = -1;
                    }
                }

                const targetX = bot.prevX + dx;
                const targetY = bot.prevY + dy;
                const key = `${targetX},${targetY}`;

                // Collision
                if (
                    targetX >= 0 && targetX < gridW &&
                    targetY >= 0 && targetY < gridH &&
                    !occupied.has(key)
                ) {
                    bot.nextX = targetX;
                    bot.nextY = targetY;
                    occupied.add(key);
                    occupied.delete(`${bot.prevX},${bot.prevY}`);

                    // CHECK CAPTURE
                    if (hotspot && bot.nextX === hotspot.x && bot.nextY === hotspot.y) {
                        scores[bot.team] += 1;

                        explosions.push({
                            x: (hotspot.x * cellSize) + (cellSize/2),
                            y: (hotspot.y * cellSize) + (cellSize/2),
                            age: 0,
                            color: bot.team === 'red' ? '#dc2626' : '#6b7280'
                        });

                        hotspot = null;
                    }

                } else {
                    bot.nextX = bot.prevX;
                    bot.nextY = bot.prevY;
                }
            });
        }

        // 3. RENDER
        const t = tickProgress / tickDuration;
        const ease = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        // Draw Hotspot
        if (hotspot) {
            const hx = (hotspot.x * cellSize) + (cellSize/2);
            const hy = (hotspot.y * cellSize) + (cellSize/2);
            const pulse = 1 + Math.sin(Date.now() / 150) * 0.3;

            ctx.fillStyle = "rgba(234, 179, 8, 0.2)";
            ctx.beginPath();
            ctx.arc(hx, hy, (cellSize/2) * pulse * 1.5, 0, Math.PI*2);
            ctx.fill();

            ctx.fillStyle = "#eab308";
            const size = (cellSize/3);
            ctx.fillRect(hx - size/2, hy - size/2, size, size);
        }

        // Draw Explosions
        for (let i = explosions.length - 1; i >= 0; i--) {
            const exp = explosions[i];
            exp.age += 0.05;

            ctx.beginPath();
            ctx.strokeStyle = exp.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 1 - exp.age;
            ctx.arc(exp.x, exp.y, cellSize * exp.age * 3, 0, Math.PI*2);
            ctx.stroke();
            ctx.globalAlpha = 1;

            if (exp.age >= 1) explosions.splice(i, 1);
        }

        let foundHover = null;

        // Draw Bots
        bots.forEach(bot => {
            const curX = bot.prevX + (bot.nextX - bot.prevX) * ease;
            const curY = bot.prevY + (bot.nextY - bot.prevY) * ease;

            const px = (curX * cellSize) + (cellSize / 2);
            const py = (curY * cellSize) + (cellSize / 2);

            ctx.beginPath();
            ctx.fillStyle = bot.team === 'red' ? '#dc2626' : '#6b7280';
            ctx.arc(px, py, cellSize * 0.35, 0, Math.PI * 2);
            ctx.fill();

            if (bot.intent === 'RACING') {
                ctx.fillStyle = "#fff";
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI*2);
                ctx.fill();
            }

            if (bot.team === 'red') {
                 ctx.shadowColor = '#dc2626';
                 ctx.shadowBlur = 15;
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.fill();
            ctx.shadowBlur = 0;

            const dist = Math.hypot(px - mouseX, py - mouseY);
            if (dist < cellSize / 2) {
                foundHover = bot;
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // STICKY HOVER LOGIC
        // Only update hoveredBot if we actually hit something.
        // This keeps the last bot active if the user moves mouse away.
        if (foundHover) {
            hoveredBot = foundHover;
        }

        requestAnimationFrame(draw);
    }

    const animId = requestAnimationFrame(draw);
    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animId);
    };
  }

  onMount(() => {
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    const cleanupSim = initSimulation();
    return () => {
        clearInterval(interval);
        if (cleanupSim) cleanupSim();
    };
  });
</script>

<svelte:head>
  <title>Maintainer One | Protocol T</title>
  <meta name="description" content="Competitive Engineering. Open Source Strategy. Protocol T launches Jan 1, 2026." />
</svelte:head>

<div class="bg-black min-h-screen text-gray-200 font-mono selection:bg-red-900 selection:text-white overflow-x-hidden flex flex-col">

  <section class="relative flex-grow flex flex-col items-center justify-center p-6 border-b border-gray-800 min-h-[calc(100vh-3rem)] overflow-hidden">

    <canvas
        bind:this={canvas}
        class="absolute inset-0 z-0 opacity-50"
    ></canvas>

    <div class="absolute inset-0 pointer-events-none z-10 opacity-5 bg-gradient-to-b from-transparent via-white/5 to-transparent bg-[length:100%_4px]"></div>

    <div class="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none opacity-80">
        <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-red-700 rounded-full shadow-[0_0_10px_red]"></div>
            <span class="text-xl font-bold text-white tracking-widest">{String(scores.red).padStart(3, '0')}</span>
        </div>
        <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span class="text-xl font-bold text-gray-400 tracking-widest">{String(scores.gray).padStart(3, '0')}</span>
        </div>
    </div>

    {#if hoveredBot}
        <div
            class="absolute z-20 bg-black/90 border border-gray-700 p-3 rounded pointer-events-none backdrop-blur shadow-xl"
            style="left: 20px; bottom: 40px;"
            transition:fade={{ duration: 100 }}
        >
            <div class="text-xs text-gray-500 uppercase tracking-widest mb-1">Unit Info</div>
            <div class="text-lg font-bold text-white mb-1">ID: {hoveredBot.id}</div>
            <div class="flex items-center gap-2 text-xs mb-2">
                Team:
                <span class={hoveredBot.team === 'red' ? "text-red-500 font-bold" : "text-gray-400 font-bold"}>
                    {hoveredBot.team.toUpperCase()}
                </span>
            </div>
            <div class="text-xs font-mono bg-gray-900 p-1 rounded border border-gray-800">
                > INTENT: {hoveredBot.intent}
            </div>
        </div>
    {/if}

    <div class="z-20 text-center space-y-6 max-w-4xl w-full pointer-events-none">
      <img class="w-24 h-24 mx-auto mb-8 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" alt="Maintainer One Logo" src={logo}/>
      <div class="inline-block border border-red-900/50 bg-red-900/10 px-3 py-1 rounded text-red-500 text-xs tracking-widest mb-4 pointer-events-auto">
        STATUS: PRE-ALPHA
      </div>

      <h1 class="text-4xl md:text-6xl font-bold tracking-tighter text-white">
        MAINTAINER<span class="text-red-700">.</span>ONE
      </h1>

      <p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
        Write Code. Deploy Logic. <span class="text-white">Dominate the Grid.</span>
      </p>

      <div class="grid grid-cols-4 gap-2 md:gap-4 text-center py-8 max-w-2xl mx-auto pointer-events-auto">
        {#each Object.entries(timeLeft) as [label, value]}
          <div class="border border-gray-800 p-3 md:p-4 rounded bg-gray-900/80 backdrop-blur-sm">
            <div class="text-2xl md:text-5xl font-bold text-white font-mono">{String(value).padStart(2, '0')}</div>
            <div class="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mt-1">{label}</div>
          </div>
        {/each}
      </div>

      <p class="text-sm text-gray-500 tracking-wide uppercase">
        Time until <span class="text-red-500 font-bold glow-text">Protocol T</span> Launch
      </p>

      <div class="pt-8 w-full flex justify-center pointer-events-auto" transition:fade>
        <a
          href="https://github.com/Maintainer-One"
          target="_blank"
          rel="noreferrer"
          class="group relative inline-flex items-center gap-4 bg-white text-black hover:bg-red-700 hover:text-white px-8 py-5 font-bold tracking-wide transition-all duration-300"
        >
          <svg viewBox="0 0 24 24" class="w-6 h-6 fill-current transition-transform group-hover:scale-110" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>

          <div class="flex flex-col text-left">
            <span class="text-xs uppercase tracking-wider opacity-60 group-hover:text-white/80">Organization Link</span>
            <span class="text-lg">VIEW_REPOSITORIES();</span>
          </div>

          <span class="text-2xl group-hover:translate-x-1 transition-transform">→</span>
        </a>
      </div>

      <p class="text-xs text-gray-600 pt-4">
        * Repositories initializing. Follow the org for updates.
      </p>

    </div>
  </section>

  <section class="max-w-5xl mx-auto py-24 px-6 grid md:grid-cols-2 gap-16 relative z-10 bg-black">

    <div class="space-y-8">
      <h2 class="text-3xl font-bold text-white border-l-4 border-red-600 pl-4">The Philosophy</h2>
      <p class="leading-relaxed text-gray-400">
        Most coding games are puzzles. <strong>Maintainer One</strong> is a sport.
        <br><br>
        We don't test if you can reverse a binary tree. We test if you can architect a resilient system that executes under strict CPU constraints and aggressive competition.
      </p>
      <ul class="space-y-6 mt-8">
        <li class="flex gap-4 items-start">
          <span class="text-red-700 font-bold font-mono">01.</span>
          <div>
            <strong class="text-white block mb-1">Community as Engine</strong>
            <span class="text-gray-500 text-sm">Teams are GitHub Repos. Matches are PRs. The meta evolves via community proposals.</span>
          </div>
        </li>
        <li class="flex gap-4 items-start">
          <span class="text-red-700 font-bold font-mono">02.</span>
          <div>
            <strong class="text-white block mb-1">Code Lock</strong>
            <span class="text-gray-500 text-sm">Code is frozen before each match week to encourage robust, automated code. No human intervention. Your architecture must survive the chaos alone.</span>
          </div>
        </li>
        <li class="flex gap-4 items-start">
          <span class="text-red-700 font-bold font-mono">03.</span>
          <div>
            <strong class="text-white block mb-1">Open Source Espionage</strong>
            <span class="text-gray-500 text-sm">Public repos mean public strategies. Forking is allowed. Winning requires understanding.</span>
          </div>
        </li>
      </ul>
    </div>

    <div class="space-y-8">
      <h2 class="text-3xl font-bold text-white border-l-4 border-red-600 pl-4">Protocol T (Jan '26)</h2>
      <p class="leading-relaxed text-gray-400">
        The Exhibition Season. A simplified physics engine designed to stress-test the infrastructure and your intent-handling logic.
      </p>

      <div class="p-6 border border-gray-800 bg-gray-900/30 font-mono text-sm space-y-4">
        <div>
          <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">Objective</span>
          <span class="text-white">Spatial Control (King of the Hill)</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">Grid Size</span>
            <span class="text-green-400">24x24 Void</span>
          </div>
          <div>
            <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">Vision</span>
            <span class="text-green-400">God Mode (Full State)</span>
          </div>
          <div>
            <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">Runtime</span>
            <span class="text-green-400">Deno (Strict Mode)</span>
          </div>
          <div>
            <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">API Style</span>
            <span class="text-green-400">Intent Injection</span>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-800">
           <span class="text-gray-500 block text-xs uppercase tracking-wider mb-2">Sample Intent</span>
           <code class="block bg-black p-3 text-gray-300 rounded border border-gray-800">
             unit.<span class="text-yellow-400">move</span>(Direction.<span class="text-purple-400">North</span>);
           </code>
        </div>
      </div>
    </div>

  </section>

  <footer class="text-center py-12 text-gray-600 text-xs border-t border-gray-900 font-mono relative z-10 bg-black">
    <p>INIT: 2026-01-01 // MAINTAINER ONE</p>
  </footer>
</div>

<style>
  .glow-text {
    text-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
  }
</style>