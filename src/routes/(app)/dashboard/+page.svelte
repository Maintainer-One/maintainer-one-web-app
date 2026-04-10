<script lang="ts">
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";

  let userEmail = "Maintainer";

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      userEmail = session.user.email.split('@')[0];
    }
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

  <div class="grid md:grid-cols-3 gap-6">
    <!-- Quick Stats -->
    <div class="p-6 border border-gray-800 bg-gray-900/30">
      <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">Active League</h3>
      <div class="text-2xl font-bold text-stone-200">Maintainer One</div>
      <div class="text-sm text-green-500 mt-2">Season 1 Ongoing</div>
    </div>
    
    <div class="p-6 border border-gray-800 bg-gray-900/30">
      <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">My Team</h3>
      <div class="text-2xl font-bold text-stone-200">Not Assigned</div>
      <button class="mt-4 text-xs bg-red-900/20 text-red-400 px-3 py-1 border border-red-900/50 hover:bg-red-900/40 uppercase tracking-widest">Register Team</button>
    </div>

    <div class="p-6 border border-gray-800 bg-gray-900/30">
      <h3 class="text-xs uppercase tracking-widest text-gray-500 mb-4 border-b border-gray-800 pb-2">Next Match</h3>
      <div class="text-2xl font-bold text-stone-200">Pending Schedule</div>
    </div>
  </div>

  <div class="grid md:grid-cols-2 gap-6">
    <div class="border border-gray-800 p-6">
      <h3 class="text-lg font-bold text-stone-200 border-l-2 border-red-600 pl-3 mb-4">Recent Games</h3>
      <p class="text-sm text-gray-500">No games have been scheduled yet for Protocol Alpha.</p>
    </div>
    <div class="border border-gray-800 p-6">
      <h3 class="text-lg font-bold text-stone-200 border-l-2 border-red-600 pl-3 mb-4">League Standings</h3>
      <p class="text-sm text-gray-500">Teams must be registered to view standings.</p>
    </div>
  </div>
</div>
