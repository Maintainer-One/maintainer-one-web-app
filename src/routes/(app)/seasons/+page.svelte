<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";

  let seasons = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const { data } = await supabase.from('seasons').select('*, leagues(name)');
    if (data) seasons = data;
    loading = false;
  });
</script>

<div class="max-w-4xl mx-auto space-y-8 animate-fade-in fade-in">
  <header class="border-b border-stone-800 pb-8">
    <h1 class="text-5xl font-black text-white uppercase tracking-tighter">Seasons</h1>
    <p class="text-[10px] text-red-500 uppercase tracking-[0.3em] font-bold mt-2">Temporal Records / Protocol Alpha</p>
  </header>

  {#if loading}
    <div class="space-y-4">
      <div class="h-32 bg-gray-900/40 animate-pulse border border-gray-800"></div>
    </div>
  {:else if seasons.length === 0}
    <div class="py-20 text-center border border-dashed border-gray-800 bg-gray-900/10">
      <p class="text-gray-600 font-mono text-xs uppercase tracking-widest">No Temporal Cycles Identified</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each seasons as season}
         <div class="p-8 border border-gray-800 bg-gray-900/20 hover:border-red-900/50 transition-all group">
            <div class="flex justify-between items-start">
               <div>
                  <div class="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{season.leagues?.name}</div>
                  <h2 class="text-3xl font-black text-stone-200 uppercase tracking-tight group-hover:text-white transition-colors">
                    {season.name}
                  </h2>
               </div>
               <div class="px-3 py-1 bg-green-900/20 text-green-500 border border-green-900/50 text-[10px] uppercase font-bold tracking-widest">
                 {season.status}
               </div>
            </div>
            
            <div class="mt-8 flex gap-8">
               <div class="flex flex-col">
                  <span class="text-[10px] text-gray-600 uppercase tracking-tighter">Games Played</span>
                  <span class="text-xl font-bold font-mono text-stone-300">0</span>
               </div>
               <div class="flex flex-col border-l border-gray-800 pl-8">
                  <span class="text-[10px] text-gray-600 uppercase tracking-tighter">Avg Fortune Swing</span>
                  <span class="text-xl font-bold font-mono text-stone-300">0.0%</span>
               </div>
            </div>
            
            <div class="mt-8 pt-6 border-t border-gray-800/50 flex justify-end">
               <button class="text-xs text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors">View Schedule & Archive →</button>
            </div>
         </div>
      {/each}
    </div>
  {/if}
</div>
