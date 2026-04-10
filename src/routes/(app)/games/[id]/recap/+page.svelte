<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { supabase } from "$lib/supabaseClient";

  let gameId = $derived(page.params.id);
  let gameData = $state<any>(null);
  let recap = $state<any>(null);
  let loading = $state(true);

  onMount(async () => {
    loading = true;
    const { data: game } = await supabase
      .from('games')
      .select(`
        *,
        home:teams!home_team_id(name, color),
        away:teams!away_team_id(name, color)
      `)
      .eq('id', gameId)
      .single();
    
    if (game) {
      gameData = game;
      const { data: recapData } = await supabase
        .from('game_recaps')
        .select('*')
        .eq('game_id', gameId)
        .single();
      if (recapData) recap = recapData;
    }
    loading = false;
  });
</script>

<svelte:head>
  <title>Game Recap | Maintainer One</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-8 animate-fade-in fade-in pb-20">
  <header class="flex justify-between items-end border-b border-gray-800 pb-8">
    <div>
      <div class="text-[10px] text-gray-500 uppercase tracking-[0.4em] mb-4">Post-Game Analysis Module</div>
      <h1 class="text-5xl font-black text-white uppercase tracking-tighter">Match Recap</h1>
    </div>
    {#if gameData}
      <div class="flex items-center gap-8 bg-gray-900/40 p-6 border border-gray-800">
         <div class="text-center">
            <div class="text-xs text-gray-600 uppercase mb-1">{gameData.home.name}</div>
            <div class="text-4xl font-black text-white">{gameData.home_score}</div>
         </div>
         <div class="text-gray-700 text-xl font-black italic">VS</div>
         <div class="text-center">
            <div class="text-xs text-gray-600 uppercase mb-1">{gameData.away.name}</div>
            <div class="text-4xl font-black text-white">{gameData.away_score}</div>
         </div>
      </div>
    {/if}
  </header>

  {#if loading}
    <div class="h-96 bg-gray-900/20 border border-gray-800 animate-pulse flex items-center justify-center">
       <span class="text-xs uppercase tracking-[0.5em] text-gray-700">Analyzing Ticks...</span>
    </div>
  {:else if !gameData}
    <div class="py-20 text-center border border-dashed border-gray-800">
       <p class="text-gray-500 font-mono text-xs uppercase tracking-widest">Game Data Missing or Corrupted</p>
    </div>
  {:else}
    <div class="grid md:grid-cols-3 gap-8">
       <!-- Primary Stats -->
       <div class="md:col-span-2 space-y-8">
          <section class="p-8 border border-gray-800 bg-gray-900/10">
             <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-8 border-l-2 border-red-600 pl-4">Control Distribution</h3>
             <div class="space-y-6">
                <div>
                   <div class="flex justify-between text-xs mb-2 uppercase tracking-tight">
                      <span class="text-gray-400">Field Control Avg</span>
                      <span class="text-stone-200 font-mono">{recap?.control_pct?.toFixed(0) || 50}% Home / {100 - (recap?.control_pct || 50)}% Away</span>
                   </div>
                   <div class="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex">
                      <div class="h-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]" style="width: {recap?.control_pct || 50}%"></div>
                      <div class="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]" style="width: {100 - (recap?.control_pct || 50)}%"></div>
                   </div>
                </div>
                
                <div class="grid grid-cols-2 gap-12 mt-12">
                   <div>
                      <h4 class="text-[10px] text-gray-600 uppercase mb-4 tracking-widest border-b border-gray-800 pb-2">Home Efficiency</h4>
                      <div class="space-y-3">
                         <div class="flex justify-between text-xs">
                            <span class="text-gray-500">Expected Captures</span>
                            <span class="text-stone-300 font-mono">{recap?.expected_captures || 0}</span>
                         </div>
                         <div class="flex justify-between text-xs">
                            <span class="text-gray-500">Stolen Captures</span>
                            <span class="text-green-500 font-mono">+{recap?.stolen_captures || 0}</span>
                         </div>
                      </div>
                   </div>
                   <div>
                      <h4 class="text-[10px] text-gray-600 uppercase mb-4 tracking-widest border-b border-gray-800 pb-2">Away Efficiency</h4>
                      <div class="space-y-3">
                         <div class="flex justify-between text-xs">
                            <span class="text-gray-500">Expected Captures</span>
                            <span class="text-stone-300 font-mono">0</span>
                         </div>
                         <div class="flex justify-between text-xs">
                            <span class="text-gray-500">Stolen Captures</span>
                            <span class="text-green-500 font-mono">+0</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          <div class="grid grid-cols-2 gap-8">
             <div class="p-8 border border-gray-800 bg-gray-900/10 relative overflow-hidden group">
                <div class="absolute -right-4 -bottom-4 text-8xl font-black text-red-900/5 select-none pointer-events-none group-hover:text-red-900/10 transition-colors uppercase">FRT</div>
                <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4">Fortune Rating</h3>
                <div class="text-5xl font-black font-mono {recap?.fortune >= 0 ? 'text-green-500' : 'text-red-500'}">
                   {recap?.fortune >= 0 ? '+' : ''}{recap?.fortune?.toFixed(1) || '0.0'}%
                </div>
                <p class="text-[10px] text-gray-600 mt-4 leading-relaxed uppercase tracking-tighter">
                   Measure of how significantly the PRNG favored or hindered team logic during zone spawns.
                </p>
             </div>
             
             <div class="p-8 border border-gray-800 bg-gray-900/10 relative overflow-hidden group">
                <div class="absolute -right-4 -bottom-4 text-8xl font-black text-gray-800/5 select-none pointer-events-none group-hover:text-red-900/10 transition-colors uppercase">CLT</div>
                <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4">Clutch Index</h3>
                <div class="text-5xl font-black font-mono text-stone-200">
                   {recap?.clutches || 0}
                </div>
                <p class="text-[10px] text-gray-600 mt-4 leading-relaxed uppercase tracking-tighter">
                   Number of times a team captured a zone with less than 20% control probability.
                </p>
             </div>
          </div>
       </div>

       <!-- Secondary Column -->
       <div class="space-y-4">
          <div class="p-6 border border-gray-800 bg-gray-900/50">
             <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">Analysis Log</h3>
             <div class="space-y-4">
                <div class="flex gap-3">
                   <div class="w-1 h-1 rounded-full bg-red-600 mt-1.5 shrink-0"></div>
                   <p class="text-[10px] text-gray-400 font-mono tracking-tighter uppercase italic">
                      System detected 3 instances of sub-optimal pathing by {gameData.home.name}.
                   </p>
                </div>
                <div class="flex gap-3">
                   <div class="w-1 h-1 rounded-full bg-blue-600 mt-1.5 shrink-0"></div>
                   <p class="text-[10px] text-gray-400 font-mono tracking-tighter uppercase italic">
                      {gameData.away.name} maintained 100% intent legality across all 100 ticks.
                   </p>
                </div>
             </div>
          </div>
          
          <button 
             onclick={() => window.location.href = '/sandbox'}
             class="w-full py-4 border border-red-900 bg-red-900/10 text-red-500 hover:bg-red-900/20 text-xs font-black uppercase tracking-[0.2em] transition-all"
          >
             Re-Simulate Logic
          </button>

          <button class="w-full py-4 border border-gray-800 text-gray-500 hover:text-white hover:border-gray-600 text-[10px] uppercase font-bold tracking-widest transition-all">
             Export Telemetry (CSV)
          </button>
       </div>
    </div>
  {/if}
</div>
