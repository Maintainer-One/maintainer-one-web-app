<script lang="ts">
  import { onMount } from "svelte";
  import M1Logo from "$lib/components/M1Logo.svelte";

  // --- ENTITIES ---
  interface Player {
    id: string;
    team: "red" | "gray";
    prevX: number;
    prevY: number;
    nextX: number;
    nextY: number;
  }

  interface PointZone {
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
  const MAX_PLAYERS = 10;

  // --- STATE ---
  let canvas: HTMLCanvasElement;

  // --- FIELD DIMENSIONS ---
  let DIMENSIONS = {
    width: 0,
    insetWidth: 0,
    displayWidth: 0,
    height: 0,
    insetHeight: 0,
    displayHeight: 0,
    cellSize: 32,
  };

  // --- ENGINE SIMULATION LOGIC ---
  function initSimulation() {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const players: Player[] = [];
    let pointzone: PointZone | null = null;
    let explosions: Explosion[] = [];

    const genId = () =>
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // --- RESIZE & SPAWN ---
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      DIMENSIONS.displayWidth = canvas.parentElement?.clientWidth ||
        window.innerWidth;
      DIMENSIONS.displayHeight = canvas.parentElement?.clientHeight ||
        window.innerHeight;

      DIMENSIONS.insetWidth = DIMENSIONS.displayWidth / 8;
      DIMENSIONS.insetHeight = DIMENSIONS.displayHeight / 8;

      DIMENSIONS.width = DIMENSIONS.displayWidth -
        DIMENSIONS.insetWidth * 2;
      DIMENSIONS.height = DIMENSIONS.displayHeight -
        DIMENSIONS.insetHeight * 2;
      DIMENSIONS.width = DIMENSIONS.width -
        DIMENSIONS.width % DIMENSIONS.cellSize;
      DIMENSIONS.height = DIMENSIONS.height -
        DIMENSIONS.height % DIMENSIONS.cellSize;

      canvas.width = DIMENSIONS.displayWidth * dpr;
      canvas.height = DIMENSIONS.displayHeight * dpr;

      players.length = 0;
      const densityCount = Math.floor(
        (DIMENSIONS.width * DIMENSIONS.height) / 35000,
      );
      const playerCount = Math.min(MAX_PLAYERS, densityCount);

      const gridW = Math.ceil(DIMENSIONS.width / DIMENSIONS.cellSize);
      const gridH = Math.ceil(DIMENSIONS.height / DIMENSIONS.cellSize);

      for (let i = 0; i < playerCount; i++) {
        const startX = Math.floor(Math.random() * gridW);
        const startY = Math.floor(Math.random() * gridH);
        players.push({
          id: genId(),
          team: i % 2 === 0 ? "red" : "gray",
          prevX: startX,
          prevY: startY,
          nextX: startX,
          nextY: startY,
        });
      }
    };

    window.addEventListener("resize", resize);
    resize();

    // --- GAME LOOP ---
    let tickProgress = 0;
    const tickDuration = 40;
    let animId: number;

    function draw() {
      if (!ctx) return;

      // 1. Clear & Draw Grid
      ctx.clearRect(
        0,
        0,
        DIMENSIONS.displayWidth,
        DIMENSIONS.displayHeight,
      );
      ctx.strokeStyle = "rgba(50, 50, 50, 0.3)";

      ctx.lineWidth = 6;
      ctx.beginPath();

      ctx.strokeRect(
        DIMENSIONS.insetWidth - 3,
        DIMENSIONS.insetHeight - 3,
        DIMENSIONS.width + 6,
        DIMENSIONS.height + 6,
      );
      ctx.strokeStyle = "rgba(50, 50, 50, 0.3)";
      ctx.lineWidth = 1;
      for (
        let x = DIMENSIONS.insetWidth;
        x <= DIMENSIONS.width + DIMENSIONS.insetWidth;
        x += DIMENSIONS.cellSize
      ) {
        ctx.moveTo(x, 0 + DIMENSIONS.insetHeight);
        ctx.lineTo(x, DIMENSIONS.height + DIMENSIONS.insetHeight);
      }
      for (
        let y = DIMENSIONS.insetHeight;
        y <= DIMENSIONS.height + DIMENSIONS.insetHeight;
        y += DIMENSIONS.cellSize
      ) {
        ctx.moveTo(0 + DIMENSIONS.insetWidth, y);
        ctx.lineTo(DIMENSIONS.width + DIMENSIONS.insetWidth, y);
      }
      ctx.stroke();

      // 2. LOGIC UPDATE
      tickProgress++;
      if (tickProgress >= tickDuration) {
        tickProgress = 0;
        const gridW = Math.ceil(DIMENSIONS.width / DIMENSIONS.cellSize);
        const gridH = Math.ceil(DIMENSIONS.height / DIMENSIONS.cellSize);

        if (!pointzone && Math.random() > 0.1) {
          pointzone = {
            x: Math.floor(Math.random() * gridW),
            y: Math.floor(Math.random() * gridH),
          };
        }

        let chaserIds = new Set<string>();
        if (pointzone) {
          const distances = players.map((b) => ({
            id: b.id,
            dist: Math.abs(b.prevX - pointzone!.x) +
              Math.abs(b.prevY - pointzone!.y),
          }));
          distances.sort((a, b) => a.dist - b.dist);
          distances.slice(0, 4).forEach((d) => chaserIds.add(d.id));
        }

        const occupied = new Set<string>();
        players.forEach((b) => occupied.add(`${b.nextX},${b.nextY}`));

        players.forEach((player) => {
          player.prevX = player.nextX;
          player.prevY = player.nextY;

          let dx = 0;
          let dy = 0;

          if (pointzone && chaserIds.has(player.id)) {
            if (pointzone.x > player.prevX) dx = 1;
            else if (pointzone.x < player.prevX) dx = -1;
            else if (pointzone.y > player.prevY) dy = 1;
            else if (pointzone.y < player.prevY) dy = -1;
          } else {
            if (Math.random() > 0.3) {
              const r = Math.floor(Math.random() * 4);
              if (r === 0) dy = -1;
              if (r === 1) dx = 1;
              if (r === 2) dy = 1;
              if (r === 3) dx = -1;
            }
          }

          const targetX = player.prevX + dx;
          const targetY = player.prevY + dy;
          const key = `${targetX},${targetY}`;

          if (
            targetX >= 0 && targetX < gridW &&
            targetY >= 0 && targetY < gridH &&
            !occupied.has(key)
          ) {
            player.nextX = targetX;
            player.nextY = targetY;
            occupied.add(key);
            occupied.delete(`${player.prevX},${player.prevY}`);
          } else {
            player.nextX = player.prevX;
            player.nextY = player.prevY;
          }

          if (
            pointzone
          ) {
            let distanceToPointZone = Math.abs(player.nextX - pointzone.x) +
              Math.abs(player.nextY - pointzone.y);

            if (distanceToPointZone === 0) {
              explosions.push({
                x: (pointzone.x * DIMENSIONS.cellSize +
                  DIMENSIONS.insetWidth) + (DIMENSIONS.cellSize / 2),
                y: (pointzone.y * DIMENSIONS.cellSize +
                  DIMENSIONS.insetHeight) + (DIMENSIONS.cellSize / 2),
                age: 0,
                color: player.team === "red" ? "#dc2626" : "#6b7280",
              });
              pointzone = null;
            }
          }
        });
      }

      // 3. RENDER
      const t = tickProgress / tickDuration;
      const ease = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      if (pointzone) {
        const hx =
          (pointzone.x * DIMENSIONS.cellSize + DIMENSIONS.insetWidth) +
          (DIMENSIONS.cellSize / 2);
        const hy =
          (pointzone.y * DIMENSIONS.cellSize + DIMENSIONS.insetHeight) +
          (DIMENSIONS.cellSize / 2);
        const pulse = 1 + Math.sin(Date.now() / 150) * 0.3;
        ctx.fillStyle = "rgba(234, 179, 8, 0.2)";
        ctx.beginPath();
        ctx.arc(
          hx,
          hy,
          (DIMENSIONS.cellSize / 2) * pulse * 1.5,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.fillStyle = "#eab308";
        const size = DIMENSIONS.cellSize / 3;
        ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
      }

      for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.age += 0.05;
        ctx.beginPath();
        ctx.strokeStyle = exp.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1 - exp.age;
        ctx.arc(
          exp.x,
          exp.y,
          DIMENSIONS.cellSize * exp.age * 3,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (exp.age >= 1) explosions.splice(i, 1);
      }

      players.forEach((player) => {
        const curX = prefersReducedMotion
          ? player.nextX
          : player.prevX + (player.nextX - player.prevX) * ease;
        const curY = prefersReducedMotion
          ? player.nextY
          : player.prevY + (player.nextY - player.prevY) * ease;
        const px = (curX * DIMENSIONS.cellSize + DIMENSIONS.insetWidth) +
          (DIMENSIONS.cellSize / 2);
        const py = (curY * DIMENSIONS.cellSize + DIMENSIONS.insetHeight) +
          (DIMENSIONS.cellSize / 2);

        ctx.beginPath();
        ctx.fillStyle = player.team === "red" ? "#dc2626" : "#6b7280";
        ctx.arc(px, py, DIMENSIONS.cellSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        if (player.team === "red") {
          ctx.shadowColor = "#dc2626";
          ctx.shadowBlur = 15;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(draw);
      }
    }

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }

  onMount(() => {
    const cleanupSim = initSimulation();
    return () => {
      if (cleanupSim) cleanupSim();
    };
  });
</script>

<svelte:head>
  <title>Maintainer One</title>
  <meta
    name="description"
    content="Competitive Engineering. Open Source Strategy. Protocol One launches Q1 2026."
  />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin="anonymous"
  >
  <link
    href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap"
    rel="stylesheet"
  >
</svelte:head>

<div
  class="bg-black min-h-screen text-gray-200 selection:bg-red-900 selection:text-stone-200 overflow-x-hidden flex flex-col"
  style="font-family: 'JetBrains Mono', monospace"
>
  <section
    class="relative grow flex flex-col items-center justify-center p-6 border-b border-gray-800 min-h-[calc(100vh-3rem)]"
  >
    <canvas
      bind:this={canvas}
      class="absolute inset-0 z-0 opacity-50"
    ></canvas>

    <div
      class="absolute inset-0 pointer-events-none z-20 opacity-5 bg-linear-to-b from-transparent via-white/5 to-transparent bg-size-[100%_4px]"
    >
    </div>

    <div
      class="z-30 text-center space-y-6 max-w-4xl w-full pointer-events-none"
    >
      <M1Logo
        class="w-24 h-24 text-red-700 mx-auto mb-8 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]"
      />

      <h1 class="text-4xl md:text-6xl font-bold tracking-tighter text-white">
        MAINTAINER ONE
      </h1>

      <p class="text-md md:text-lg text-gray-400 max-w-2xl mx-auto pb-1">
        The sports sim powered by open source logic.
      </p>

      <p class="text-sm md:text-md text-gray-400 max-w-2xl mx-auto pb-8">
        Code. Community. <span class="text-stone-200">Championships.</span>
      </p>

      <div
        class="inline-block border border-red-900/50 bg-red-900/10 px-3 py-1 rounded text-red-500 text-xs tracking-widest mb-4 pointer-events-auto"
      >
        STATUS: PRE-ALPHA
      </div>

      <p class="text-sm text-gray-500 tracking-wide uppercase pt-4">
        Coming Q1 2026
      </p>
    </div>
  </section>

  <section
    class="max-w-5xl mx-auto py-24 px-6 grid md:grid-cols-2 gap-16 relative z-10 bg-black"
  >
    <div class="space-y-8">
      <h2
        class="text-3xl font-bold text-stone-200 border-l-4 border-red-600 pl-4"
      >
        The Pitch
      </h2>
      <ul class="space-y-6 mt-8">
        <li class="flex gap-4 items-start">
          <div>
            <strong class="text-stone-200 block mb-1">Code</strong>
            <span class="text-gray-500 text-sm"
            >At its heart, Maintainer One is a coding game where all the logic
              and decisions are automated through code. Each league has an
              evolving protocol that determines the rules and constraints each
              team plays under.</span>
          </div>
        </li>
        <li class="flex gap-4 items-start">
          <div>
            <strong class="text-stone-200 block mb-1">Community</strong>
            <span class="text-gray-500 text-sm"
            >Maintainer One is open source and community driven. The maintainer
              for each team is responsible for fostering a strong community of
              contributors to develop the most robust logic and gameplans to
              adapt to the other teams and an evolving protocol.</span>
          </div>
        </li>
        <li class="flex gap-4 items-start">
          <div>
            <strong class="text-stone-200 block mb-1">Championships</strong>
            <span class="text-gray-500 text-sm"
            >Only one team can win each season and the maintainer of that team
              will be awarded the Maintainer One title.</span>
          </div>
        </li>
      </ul>
    </div>

    <div class="space-y-8">
      <h2
        class="text-3xl font-bold text-stone-200 border-l-4 border-red-600 pl-4"
      >
        Upcoming
      </h2>
      <div class="p-6 border border-gray-800 bg-gray-900/30 text-sm space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span
              class="text-gray-500 block text-xs uppercase tracking-wider mb-1"
            >Name</span>
            <span class="text-stone-200">Protocol One</span>
          </div>
          <div>
            <span
              class="text-gray-500 block text-xs uppercase tracking-wider mb-1"
            >Launch</span>
            <span class="text-green-400">TBD</span>
          </div>
          <div class="col-span-2">
            <span
              class="text-gray-500 block text-xs uppercase tracking-wider mb-1"
            >Description</span>
            <span class="text-stone-200"
            >The premier league for Maintainer One with the most complex
              protocol to solve.<br /><br />The first season will exhibit a
              simplified protocol that resembles the above real time simulation.
              Point zones spawn in and the first player to occupy that square
              scores the point for their team.</span>
          </div>
          <div class="col-span-2">
            <span
              class="text-gray-500 block text-xs uppercase tracking-wider mb-1"
            >Maintainer One</span>
            <span class="text-stone-200"
            >The first Maintainer One title will be awarded at season end to the
              Maintainer who's team performs wins the
              championship.<br /><br />In order to be elegible for the title, a
              Maintainer must have been active from the start of the season with
              the team they win with, can not have maintained another team
              during the season, and there must be at least one other Maintainer
              that has been active since the start of the season.</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="border-t border-gray-900 bg-black py-20 px-6 relative z-10">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8 text-center">
        <h2 class="text-xl font-bold text-stone-200 mb-2 tracking-widest">
          Interested?
        </h2>
        <p class="text-gray-500 text-sm">
          Contributions, ideas, and feedback are all appreciated!
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <a
          href="https://github.com/Maintainer-One"
          target="_blank"
          rel="noreferrer"
          class="group block p-6 border border-gray-800 hover:border-red-900 bg-gray-900/20 hover:bg-red-900/10 transition-all duration-300"
        >
          <div class="flex justify-between items-start mb-4">
            <span
              class="text-red-500 text-xs font-bold tracking-widest border border-red-900/50 px-2 py-1 bg-red-900/20"
            >CONTRIBUTE</span>
            <svg
              viewBox="0 0 24 24"
              class="w-6 h-6 fill-gray-400 group-hover:fill-white transition-colors"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
          </div>
          <p class="text-gray-500 text-sm">
            Submit PRs, fix bugs, and help build the foundation before Season 1
            begins.
          </p>
        </a>

        <a
          href="https://github.com/Maintainer-One"
          target="_blank"
          rel="noreferrer"
          class="group block p-6 border border-gray-800 hover:border-green-900 bg-gray-900/20 hover:bg-green-900/10 transition-all duration-300"
        >
          <div class="flex justify-between items-start mb-4">
            <span
              class="text-green-500 text-xs font-bold tracking-widest border border-green-900/50 px-2 py-1 bg-green-900/20"
            >DESIGN</span>
            <svg
              viewBox="0 0 24 24"
              class="w-6 h-6 fill-gray-400 group-hover:fill-white transition-colors"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"
              />
            </svg>
          </div>
          <p class="text-gray-500 text-sm">
            Have an idea for a game mechanic? A loophole in the protocol? Open
            an issue on Github and join the design conversation.
          </p>
        </a>
      </div>
    </div>
  </section>

  <footer
    class="text-center py-12 text-gray-600 text-xs border-t border-gray-900 relative z-10 bg-black"
  >
    <p>MAINTAINER ONE || 2026</p>
  </footer>
</div>
