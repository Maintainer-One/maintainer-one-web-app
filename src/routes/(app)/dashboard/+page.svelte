<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";

  let userEmail = $state("Maintainer");
  let activeLeagues = $state<any[]>([]);
  let recentGames = $state<any[]>([]);
  let loading = $state(true);

  onMount(async () => {
    loading = true;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      userEmail = session.user.email.split('@')[0];
    }

    // Fetch Active Leagues
    const { data: leagues } = await supabase
      .from('leagues')
      .select('*, seasons(*)');
    
    if (leagues) activeLeagues = leagues;

    // Fetch Recent Games with Team names and Recaps
    const { data: games } = await supabase
      .from('games')
      .select(`
        *,
        home:teams!home_team_id(name, color),
        away:teams!away_team_id(name, color),
        game_recaps(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (games) recentGames = games;
    loading = false;
  });
</script>

<svelte:head>
  <title>Dashboard | Maintainer One</title>
</svelte:head>

<div class="max-w-6xl mx-auto space-y-8 animate-fade-in fade-in">
  <header>
    <h1 class="text-3xl font-bold tracking-tighter text-white uppercase mb-2">System Dashboard</h1>
    <p class="text-sm text-gray-500">Welcome back, {userEmail}. Protocol Alpha is currently active.</p>
  </header>

  {#if loading}
    <div class="grid md:grid-cols-3 gap-6 animate-pulse opacity-50">
      {#each Array(3) as _}
        <div class="h-32 bg-gray-900/50 border border-gray-800 rounded-sm"></div>
      {/each}
    </div>
  {:else}
    <div class="grid md:grid-cols-3 gap-6">
      <!-- Quick Stats -->
      <div class="p-6 border border-gray-800 bg-gray-900/30 relative overflow-hidden group">
        <div class="absolute -right-2 -bottom-2 text-6xl font-black text-gray-800/10 group-hover:text-red-900/10 transition-colors">LG</div>
        <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">Active League</h3>
        <div class="text-2xl font-bold text-stone-200">{activeLeagues[0]?.name || 'Maintainer One'}</div>
        <div class="text-sm text-green-500 mt-2">Season 1 Ongoing</div>
      </div>
      
      <div class="p-6 border border-gray-800 bg-gray-900/30 relative overflow-hidden group">
        <div class="absolute -right-2 -bottom-2 text-6xl font-black text-gray-800/10 group-hover:text-red-900/10 transition-colors">TM</div>
        <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">My Team</h3>
        <div class="text-2xl font-bold text-stone-200">Not Assigned</div>
        <button class="mt-4 text-xs bg-red-900/20 text-red-400 px-3 py-1 border border-red-900/50 hover:bg-red-900/40 uppercase tracking-widest transition-colors">Register Team</button>
      </div>

      <div class="p-6 border border-gray-800 bg-gray-900/30 relative overflow-hidden group">
        <div class="absolute -right-2 -bottom-2 text-6xl font-black text-gray-800/10 group-hover:text-red-900/10 transition-colors">MT</div>
        <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">Recent Record</h3>
        <div class="text-2xl font-bold text-stone-200">0 - 0 - 0</div>
        <div class="text-sm text-gray-600 mt-2">No matches played</div>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <div class="border border-gray-800 p-8 bg-gray-900/10 relative">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-bold text-stone-200 border-l-2 border-red-600 pl-3">Recent Games</h3>
          <a href="/seasons" class="text-xs text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest">View All</a>
        </div>
        
        {#if recentGames.length === 0}
          <div class="py-12 text-center">
            <p class="text-sm text-gray-600 italic">No games record detected in history modules.</p>
            <a href="/sandbox" class="mt-4 inline-block text-xs bg-gray-800 hover:bg-gray-700 px-4 py-2 uppercase tracking-widest transition-colors">Initialize Sandbox Game</a>
          </div>
        {:else}
          <div class="space-y-4">
            {#each recentGames as game}
              <div class="flex items-center justify-between p-4 border border-gray-800/50 hover:border-gray-700 bg-black/40 transition-colors group">
                <div class="flex items-center gap-6">
                  <div class="text-center">
                    <div class="text-xs text-gray-600 mb-1">{new Date(game.created_at).toLocaleDateString()}</div>
                    <div class="text-[10px] bg-red-900/20 text-red-500 px-1 border border-red-900/50">#12</div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="font-bold text-sm tracking-widest" style="color: {game.home.color}">{game.home.name}</span>
                    <span class="text-gray-700 text-xs font-black italic">VS</span>
                    <span class="font-bold text-sm tracking-widest" style="color: {game.away.color}">{game.away.name}</span>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  {#if game.game_recaps?.[0]}
                    <div class="text-right">
                      <div class="text-[10px] text-gray-500 uppercase tracking-tighter">Fortune Swing</div>
                      <div class="text-xs font-mono {game.game_recaps[0].fortune >= 0 ? 'text-green-500' : 'text-red-500'}">
                        {game.game_recaps[0].fortune >= 0 ? '+' : ''}{game.game_recaps[0].fortune.toFixed(1)}%
                      </div>
                    </div>
                  {/if}
                  <a href="/games/{game.id}/recap" class="p-2 border border-gray-800 hover:border-red-900 group-hover:bg-red-900/10 transition-all">
                    <svg class="w-4 h-4 text-gray-500 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>
                  </a>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="border border-gray-800 p-8 bg-gray-900/10">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-bold text-stone-200 border-l-2 border-red-600 pl-3">League Standings</h3>
          <span class="text-[10px] bg-red-900/20 text-red-400 px-2 py-0.5 border border-red-900/50 uppercase tracking-widest">Protocol Alpha</span>
        </div>
        
        <table class="w-full text-xs text-left">
          <thead class="text-gray-600 uppercase tracking-widest border-b border-gray-800">
            <tr>
              <th class="py-3 font-normal">Team</th>
              <th class="py-3 font-normal text-right">W - L - D</th>
              <th class="py-3 font-normal text-right">Points</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800/50">
            {#each ['Amber', 'Beige', 'Crimson', 'Denim'] as team}
               <tr class="hover:bg-white/5 transition-colors">
                  <td class="py-4 font-bold tracking-widest uppercase">{team}</td>
                  <td class="py-4 text-right font-mono text-gray-500">0 - 0 - 0</td>
                  <td class="py-4 text-right font-mono text-red-500 font-bold">0</td>
               </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
