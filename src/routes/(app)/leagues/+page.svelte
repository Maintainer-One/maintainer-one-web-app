<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";

  let leagues = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const { data } = await supabase.from('leagues').select('*');
    if (data) leagues = data;
    loading = false;
  });
</script>

<div class="max-w-4xl mx-auto space-y-8 animate-fade-in">
  <header class="border-b border-gray-800 pb-6">
    <h1 class="text-4xl font-black text-white uppercase tracking-tighter">Leagues</h1>
    <p class="text-xs text-stone-500 uppercase tracking-widest mt-2">Protocol Alpha: Sector Monitoring</p>
  </header>

  {#if loading}
    <div class="space-y-4">
      <div class="h-20 bg-gray-900/50 animate-pulse border border-gray-800"></div>
      <div class="h-20 bg-gray-900/50 animate-pulse border border-gray-800"></div>
    </div>
  {:else if leagues.length === 0}
    <div class="py-20 text-center border border-dashed border-gray-800">
      <p class="text-gray-600 font-mono text-xs uppercase tracking-widest">No Active Leagues Detected</p>
    </div>
  {:else}
    <div class="grid gap-4">
      {#each leagues as league}
        <div class="group p-6 border border-gray-800 bg-gray-900/10 hover:bg-gray-900/30 transition-all flex justify-between items-center">
          <div>
            <h2 class="text-xl font-bold text-white uppercase tracking-tight">{league.name}</h2>
            <div class="flex gap-4 mt-2">
               <span class="text-[10px] text-gray-500 uppercase tracking-widest">Leagues / {league.id}</span>
               <span class="text-[10px] text-red-500 uppercase tracking-widest font-bold">Active</span>
            </div>
          </div>
          <button class="text-xs border border-gray-800 px-4 py-2 hover:border-red-600 hover:text-red-500 transition-all uppercase tracking-widest">Enter League</button>
        </div>
      {/each}
    </div>
  {/if}
</div>
