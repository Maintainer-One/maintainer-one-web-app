<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";

  // --- STATE ---
  let timeLeft = $state({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // TARGET DATE: Jan 1, 2026 (Local Time)
  const TARGET_DATE = new Date("2026-01-01T00:00:00").getTime();

  // --- COUNTDOWN LOGIC ---
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

  onMount(() => {
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Maintainer One | Protocol T</title>
  <meta name="description" content="Competitive Engineering. Open Source Strategy. Protocol T launches Jan 1, 2026." />
</svelte:head>

<div class="bg-black min-h-screen text-gray-200 font-mono selection:bg-red-900 selection:text-white overflow-x-hidden">

  <section class="relative h-screen flex flex-col items-center justify-center p-6 border-b border-gray-800">
    <div class="absolute inset-0 opacity-10 pointer-events-none"
         style="background-image: linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px); background-size: 24px 24px;">
    </div>

    <div class="absolute inset-0 pointer-events-none opacity-5 bg-gradient-to-b from-transparent via-white/5 to-transparent bg-[length:100%_4px]"></div>

    <div class="z-10 text-center space-y-6 max-w-4xl w-full">
      <div class="inline-block border border-red-900/50 bg-red-900/10 px-3 py-1 rounded text-red-500 text-xs tracking-widest mb-4">
        STATUS: PRE-ALPHA
      </div>

      <h1 class="text-6xl md:text-8xl font-bold tracking-tighter text-white">
        MAINTAINER<span class="text-red-600">.</span>ONE
      </h1>

      <p class="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto">
        Write Code. Deploy Logic. <span class="text-white">Dominate the Grid.</span>
      </p>

      <div class="grid grid-cols-4 gap-2 md:gap-4 text-center py-8 max-w-2xl mx-auto">
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

      <div class="pt-8 w-full flex justify-center" transition:fade>
        <a
          href="https://github.com/Maintainer-One"
          target="_blank"
          rel="noreferrer"
          class="group relative inline-flex items-center gap-4 bg-white text-black hover:bg-red-600 hover:text-white px-8 py-5 font-bold tracking-wide transition-all duration-300"
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

  <section class="max-w-5xl mx-auto py-24 px-6 grid md:grid-cols-2 gap-16">

    <div class="space-y-8">
      <h2 class="text-3xl font-bold text-white border-l-4 border-red-600 pl-4">The Pitch</h2>
      <p class="leading-relaxed text-gray-400">
        Most coding games are puzzles. <strong>Maintainer One</strong> is a sport.
        <br><br>
        We don't test if you can reverse a binary tree. We test if you can architect a resilient system that executes under strict CPU constraints and aggressive competition.
      </p>
      <ul class="space-y-6 mt-8">
        <li class="flex gap-4 items-start">
          <span class="text-red-600 font-bold font-mono">01.</span>
          <div>
            <strong class="text-white block mb-1">Community as Engine</strong>
            <span class="text-gray-500 text-sm">Teams are GitHub Repos. Matches are PRs. The meta evolves via community proposals.</span>
          </div>
        </li>
        <li class="flex gap-4 items-start">
          <span class="text-red-600 font-bold font-mono">02.</span>
          <div>
            <strong class="text-white block mb-1">Parc Fermé Rules</strong>
            <span class="text-gray-500 text-sm">Code is frozen before the match. No human intervention. Your architecture must survive the chaos alone.</span>
          </div>
        </li>
        <li class="flex gap-4 items-start">
          <span class="text-red-600 font-bold font-mono">03.</span>
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

  <footer class="text-center py-12 text-gray-600 text-xs border-t border-gray-900 font-mono">
    <p>INIT: 2026-01-01 // MAINTAINER ONE</p>
  </footer>
</div>

<style>
  /* Optional: Simple glow effect for the Protocol T text */
  .glow-text {
    text-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
  }
</style>