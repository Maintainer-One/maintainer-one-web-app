<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";

  let teams = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const { data } = await supabase.from('teams').select('*, leagues(name)');
    if (data) teams = data;
    loading = false;
  });
</script>

<div class="max-w-6xl mx-auto space-y-8 animate-fade-in fade-in">
  <header class="border-l-4 border-red-600 pl-6 py-2">
    <h1 class="text-4xl font-black text-white uppercase tracking-tighter">Active Teams</h1>
    <p class="text-xs text-stone-500 uppercase tracking-widest mt-1">Alpha Sector Verification / Teams Module</p>
  </header>

  {#if loading}
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {#each Array(4) as _}
        <div class="h-40 bg-gray-900/50 border border-gray-800"></div>
      {/each}
    </div>
  {:else if teams.length === 0}
    <div class="py-20 text-center border border-dashed border-gray-800 bg-gray-900/10">
      <p class="text-gray-600 font-mono text-xs uppercase tracking-widest">No Teams Registered in System</p>
      <button class="mt-6 text-xs bg-red-900/20 text-red-500 border border-red-900/50 px-6 py-2 uppercase tracking-widest hover:bg-red-900/40">Register New Team</button>
    </div>
  {:else}
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each teams as team}
        <div class="group relative p-6 border border-gray-800 bg-gray-900/20 hover:bg-gray-900/40 transition-all overflow-hidden">
          <div class="absolute -right-4 -bottom-4 text-7xl font-black text-gray-800/10 group-hover:text-red-900/10 transition-colors uppercase italic pointer-events-none">
            {team.name[0]}
          </div>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-2 h-8" style="background-color: {team.color || '#444'}"></div>
            <h2 class="text-xl font-bold text-white uppercase tracking-tight">{team.name}</h2>
          </div>
          <div class="space-y-1">
             <div class="text-[10px] text-gray-600 uppercase tracking-widest">League: {team.leagues?.name || 'Protocol Alpha'}</div>
             <div class="text-[10px] text-gray-600 uppercase tracking-widest">Status: Ready</div>
          </div>
          <div class="mt-6 flex justify-between items-center">
             <div class="text-xs font-mono text-gray-500">#{team.id}</div>
             <button class="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase tracking-widest transition-colors">Manage Team</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
