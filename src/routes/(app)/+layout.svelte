<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { supabase } from "$lib/supabaseClient";

  let { children } = $props();
  let initialized = $state(false);

  onMount(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      goto("/login");
    } else {
      initialized = true;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          goto("/login");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  });
</script>

{#if initialized}
  <div class="min-h-screen bg-black text-gray-200 font-mono">
    <!-- Top Nav / Header for the App -->
    <header class="border-b border-gray-800 bg-gray-900/50 p-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
      <div class="flex items-center gap-6">
        <a href="/dashboard" class="font-bold text-white tracking-widest uppercase hover:text-red-500 transition-colors">
          Maintainer One
        </a>
        <nav class="hidden md:flex gap-4 text-xs text-gray-500 uppercase tracking-widest">
          <a href="/dashboard" class="hover:text-stone-200 transition-colors">Dashboard</a>
          <a href="/leagues" class="hover:text-stone-200 transition-colors">Leagues</a>
          <a href="/teams" class="hover:text-stone-200 transition-colors">Teams</a>
          <a href="/sandbox" class="hover:text-stone-200 transition-colors">Sandbox</a>
        </nav>
      </div>
      <div>
        <button 
          onclick={() => supabase.auth.signOut()} 
          class="text-xs text-gray-500 hover:text-red-500 uppercase tracking-widest transition-colors"
        >
          Disconnect
        </button>
      </div>
    </header>

    <!-- Page Content -->
    <main class="p-6">
      {@render children()}
    </main>
  </div>
{:else}
  <div class="min-h-screen bg-black flex items-center justify-center">
    <div class="w-12 h-12 border-4 border-gray-800 border-t-red-700 rounded-full animate-spin"></div>
  </div>
{/if}
