<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import BrandLogo from '$lib/components/M1Logo.svelte';

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

  // --- CONFIG ---
  const TARGET_DATE = new Date("2026-01-01T00:00:00").getTime();
  const MAX_BOTS = 150;
  const TOOLTIP_OFFSET = 16;
  const TOOLTIP_WIDTH_EST = 220;
  const TOOLTIP_HEIGHT_EST = 140;

  // --- STATE ---
  let timeLeft = $state({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  let scores = $state({ red: 0, gray: 0 });
  let hoveredBot = $state<Bot | null>(null);
  let tooltipPos = $state({ x: 0, y: 0 });
  let canvas: HTMLCanvasElement;

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

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0; // CSS Pixels
    let height = 0; // CSS Pixels
    const cellSize = 32;

    // Mouse State
    let mouseX = -100;
    let mouseY = -100;
    let isMouseOverCanvas = false;

    const bots: Bot[] = [];
    let hotspot: Hotspot | null = null;
    let explosions: Explosion[] = [];

    const genId = () => Math.random().toString(36).substring(2, 6).toUpperCase();

    // --- RESIZE & SPAWN ---
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.parentElement?.clientWidth || window.innerWidth;
      const displayHeight = canvas.parentElement?.clientHeight || window.innerHeight;

      width = displayWidth;
      height = displayHeight;

      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;

      ctx.scale(dpr, dpr);

      bots.length = 0;
      const densityCount = Math.floor((width * height) / 35000);
      const botCount = Math.min(MAX_BOTS, densityCount);

      const gridW = Math.ceil(width / cellSize);
      const gridH = Math.ceil(height / cellSize);

      for (let i = 0; i < botCount; i++) {
        const startX = Math.floor(Math.random() * gridW);
        const startY = Math.floor(Math.random() * gridH);
        bots.push({
          id: genId(),
          team: Math.random() > 0.5 ? 'red' : 'gray',
          prevX: startX, prevY: startY,
          nextX: startX, nextY: startY,
          intent: 'IDLE'
        });
      }
    };

    // --- MOUSE TRACKING ---
    const handleMouseMove = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('section:not(:first-child)')) {
        isMouseOverCanvas = false;
        hoveredBot = null;
        return;
      }

      const rect = canvas.getBoundingClientRect();

      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;

      // Check if we are physically over the canvas area
      // (Using a small buffer so edge cases don't flicker)
      isMouseOverCanvas = (
        mouseX >= 0 &&
        mouseX <= width &&
        mouseY >= 0 &&
        mouseY <= height
      );

      // Tooltip positioning (Screen relative)
      let tx = e.clientX + TOOLTIP_OFFSET;
      let ty = e.clientY + TOOLTIP_OFFSET;

      if (tx + TOOLTIP_WIDTH_EST > window.innerWidth) {
        tx = e.clientX - TOOLTIP_WIDTH_EST - TOOLTIP_OFFSET;
      }
      if (ty + TOOLTIP_HEIGHT_EST > window.innerHeight) {
        ty = e.clientY - TOOLTIP_HEIGHT_EST - TOOLTIP_OFFSET;
      }
      tooltipPos = { x: tx, y: ty };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    resize();

    // --- GAME LOOP ---
    let tickProgress = 0;
    const tickDuration = 40;
    let animId: number;

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

            if (!hotspot && Math.random() > 0.1) {
                hotspot = {
                    x: Math.floor(Math.random() * gridW),
                    y: Math.floor(Math.random() * gridH)
                };
            }

            let chaserIds = new Set<string>();
            if (hotspot) {
                const distances = bots.map(b => ({
                    id: b.id,
                    dist: Math.abs(b.prevX - hotspot!.x) + Math.abs(b.prevY - hotspot!.y)
                }));
                distances.sort((a, b) => a.dist - b.dist);
                distances.slice(0, 4).forEach(d => chaserIds.add(d.id));
            }

            const occupied = new Set<string>();
            bots.forEach(b => occupied.add(`${b.nextX},${b.nextY}`));

            bots.forEach(bot => {
                bot.prevX = bot.nextX;
                bot.prevY = bot.nextY;

                let dx = 0;
                let dy = 0;

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

                if (
                    targetX >= 0 && targetX < gridW &&
                    targetY >= 0 && targetY < gridH &&
                    !occupied.has(key)
                ) {
                    bot.nextX = targetX;
                    bot.nextY = targetY;
                    occupied.add(key);
                    occupied.delete(`${bot.prevX},${bot.prevY}`);

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

        let newFoundBot: Bot | null = null;

        bots.forEach(bot => {
            const curX = prefersReducedMotion ? bot.nextX : bot.prevX + (bot.nextX - bot.prevX) * ease;
            const curY = prefersReducedMotion ? bot.nextY : bot.prevY + (bot.nextY - bot.prevY) * ease;
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

            // HOVER CHECK (Hit Test)
            const dist = Math.hypot(px - mouseX, py - mouseY);
            if (dist < cellSize / 2) {
                newFoundBot = bot;
            }

            // SELECTION HIGHLIGHT (Draw ring if this bot is the active one)
            // Note: We check against the STATE variable 'hoveredBot', not the hit test
            if (hoveredBot && bot.id === hoveredBot.id) {
                ctx.strokeStyle = "white";
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });

        // --- SELECTION STATE LOGIC ---
        // 1. If we found a new bot under the mouse, it becomes the active one
        if (newFoundBot) {
            hoveredBot = newFoundBot;
        }
        // 2. If we didn't find a bot, AND we are off-canvas (lower screen), clear selection
        else if (!isMouseOverCanvas) {
            hoveredBot = null;
        }
        // 3. Otherwise (didn't find a bot, but still on canvas), KEEP the previous hoveredBot

        if (!prefersReducedMotion) {
           animId = requestAnimationFrame(draw);
        }
    }

    draw();

    return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', handleMouseMove);
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
  <title>Maintainer One</title>
  <meta name="description" content="Competitive Engineering. Open Source Strategy. Protocol 1X launches Jan 1, 2026." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="bg-black min-h-screen text-gray-200 selection:bg-red-900 selection:text-white overflow-x-hidden flex flex-col" style="font-family: 'JetBrains Mono', monospace;">

  <section class="relative grow flex flex-col items-center justify-center p-6 border-b border-gray-800 min-h-[calc(100vh-3rem)] overflow-hidden">

    <canvas
        bind:this={canvas}
        class="absolute inset-0 z-0 opacity-50"
    ></canvas>

    {#if hoveredBot}
        <div
            class="absolute z-10 bg-black/95 border border-gray-700 p-3 rounded pointer-events-none backdrop-blur shadow-2xl transition-opacity duration-75"
            style="left: {tooltipPos.x}px; top: {tooltipPos.y}px;"
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

    <div class="absolute inset-0 pointer-events-none z-20 opacity-5 bg-gradient-to-b from-transparent via-white/5 to-transparent bg-[length:100%_4px]"></div>

    <div class="absolute top-4 left-4 z-30 flex flex-col gap-2 pointer-events-none opacity-80">
        <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-red-700 rounded-full shadow-[0_0_10px_red]"></div>
            <span class="text-xl font-bold text-white tracking-widest">{String(scores.red).padStart(3, '0')}</span>
        </div>
        <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-gray-500 rounded-full"></div>
            <span class="text-xl font-bold text-gray-400 tracking-widest">{String(scores.gray).padStart(3, '0')}</span>
        </div>
    </div>

    <div class="z-30 text-center space-y-6 max-w-4xl w-full pointer-events-none">
      <BrandLogo class="w-24 h-24 text-red-700 mx-auto mb-8 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />

      <h1 class="text-4xl md:text-6xl font-bold tracking-tighter text-white">
        MAINTAINER<span class="text-red-700">.</span>ONE
      </h1>

      <p class="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto pb-8">
        Code. Community. <span class="text-white">Championships.</span>
      </p>

      <div class="inline-block border border-red-900/50 bg-red-900/10 px-3 py-1 rounded text-red-500 text-xs tracking-widest mb-4 pointer-events-auto">
        STATUS: PRE-ALPHA
      </div>

      <p class="text-sm text-gray-500 tracking-wide uppercase pt-4">
        Time to <span class="text-red-500 font-bold">Protocol 1X</span> Launch
      </p>

      <div class="grid grid-cols-4 gap-2 md:gap-4 text-center pb-8 max-w-2xl mx-auto pointer-events-auto">
        {#each Object.entries(timeLeft) as [label, value]}
          <div class="border border-gray-800 p-3 md:p-4 rounded bg-gray-900/80 backdrop-blur-sm">
            <div class="text-2xl md:text-5xl font-bold text-white font-mono">{String(value).padStart(2, '0')}</div>
            <div class="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mt-1">{label}</div>
          </div>
        {/each}
      </div>

    </div>
  </section>

  <section class="max-w-5xl mx-auto py-24 px-6 grid md:grid-cols-2 gap-16 relative z-10 bg-black">

    <div class="space-y-8">
      <h2 class="text-3xl font-bold text-white border-l-4 border-red-600 pl-4">The Pitch</h2>
      <ul class="space-y-6 mt-8">
        <li class="flex gap-4 items-start">
          <div>
            <strong class="text-white block mb-1">Code</strong>
            <span class="text-gray-500 text-sm">At its heart, Maintainer One is a coding game where <strong>every</strong> action a team makes is automated through code. Each league has an evolving protocol that determines the rules and constraints each team must play under.</span>
          </div>
        </li>
        <li class="flex gap-4 items-start">
          <div>
            <strong class="text-white block mb-1">Community</strong>
            <span class="text-gray-500 text-sm">Maintainer One is also intended to be open source and community driven. Each team's code will be stored in its own repo and will depend on a maintainer and contributors to adapt to an ever changing protocol.</span>
          </div>
        </li>
        <li class="flex gap-4 items-start">
          <div>
            <strong class="text-white block mb-1">Championships</strong>
            <span class="text-gray-500 text-sm">Only one team can win each season and the maintainer of that team will be crowned Maintainer One.</span>
          </div>
        </li>
      </ul>
    </div>

    <div class="space-y-8">
      <h2 class="text-3xl font-bold text-white border-l-4 border-red-600 pl-4">Upcoming</h2>

      <div class="p-6 border border-gray-800 bg-gray-900/30 text-sm space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">Name</span>
            <span class="text-white">Protocol 1X</span>
          </div>
          <div>
            <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">Launch Date</span>
            <span class="text-green-400">Jan '26</span>
          </div>
          <div class="col-span-2">
            <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">Description</span>
            <span class="text-white">The experimental league for Protocol One that will be used to prepare <strong>for Season 1</strong> (Feb '26)</span>
          </div>
        </div>
      </div>

      <div class="p-6 border border-gray-800 bg-gray-900/30 text-sm space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">Name</span>
            <span class="text-white">Protocol One</span>
          </div>
          <div>
            <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">Launch Date</span>
            <span class="text-green-400">Feb '26</span>
          </div>
          <div class="col-span-2">
            <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">Description</span>
            <span class="text-white">The premier league for Maintainer One with the most complicated protocol to deal with.</span>
          </div>
          <div class="col-span-2">
            <span class="text-gray-500 block text-xs uppercase tracking-wider mb-1">Maintainer One</span>
            <span class="text-white">The first Maintainer One will be crowned end of Season 1 (End of February)</span>
          </div>
        </div>
      </div>
    </div>

  </section>

  <section class="border-t border-gray-900 bg-black py-20 px-6 relative z-10">
    <div class="max-w-4xl mx-auto">
        <div class="mb-8 text-center">
            <h2 class="text-xl font-bold text-white mb-2 tracking-widest">Interested?</h2>
            <p class="text-gray-500 text-sm">Contributions, ideas, and feedback are all appreciated!</p>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
            <a href="https://github.com/Maintainer-One" target="_blank" rel="noreferrer" class="group block p-6 border border-gray-800 hover:border-red-900 bg-gray-900/20 hover:bg-red-900/10 transition-all duration-300">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-red-500 text-xs font-bold tracking-widest border border-red-900/50 px-2 py-1 bg-red-900/20">CONTRIBUTE</span>
                    <svg viewBox="0 0 24 24" class="w-6 h-6 fill-gray-400 group-hover:fill-white transition-colors" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </div>
                <p class="text-gray-500 text-sm">Submit PRs, fix bugs, and help build the foundation before Season 1 begins.</p>
            </a>

            <a href="https://github.com/Maintainer-One" target="_blank" rel="noreferrer" class="group block p-6 border border-gray-800 hover:border-green-900 bg-gray-900/20 hover:bg-green-900/10 transition-all duration-300">
                <div class="flex justify-between items-start mb-4">
                    <span class="text-green-500 text-xs font-bold tracking-widest border border-green-900/50 px-2 py-1 bg-green-900/20">DESIGN</span>
                    <svg viewBox="0 0 24 24" class="w-6 h-6 fill-gray-400 group-hover:fill-white transition-colors" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
                </div>
                <p class="text-gray-500 text-sm">Have an idea for a game mechanic? A loophole in the protocol? Open an issue and join the design conversation.</p>
            </a>
        </div>
    </div>
  </section>

  <footer class="text-center py-12 text-gray-600 text-xs border-t border-gray-900 relative z-10 bg-black">
    <p>2026-01-01 // MAINTAINER ONE</p>
  </footer>
</div>