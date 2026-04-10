<script lang="ts">
  import { supabase } from "$lib/supabaseClient";
  import M1Logo from "$lib/components/M1Logo.svelte";
  import { goto } from "$app/navigation";

  let mode: "login" | "signup" = "login";

  let email = "";
  let password = "";
  let alphaKey = "";
  let errorMessage = "";
  let successMessage = "";
  let loading = false;

  const toggleMode = () => {
    mode = mode === "login" ? "signup" : "login";
    errorMessage = "";
    successMessage = "";
  };

  const handleAuth = async (e: Event) => {
    e.preventDefault();
    loading = true;
    errorMessage = "";
    successMessage = "";

    try {
      if (mode === "signup") {
        if (!alphaKey.trim()) {
          errorMessage = "Alpha Key is required.";
          loading = false;
          return;
        }

        // 1. Verify Alpha Key from DB (Basic check, Row Level Security might require a postgres function if we insert users via Supabase auth, but we can verify it here for UX then a trigger can assign it).
        // Since we are client-side, let's just do standard auth signup with metadata.
        const { data: keyData, error: keyError } = await supabase
          .from("alpha_keys")
          .select("id, is_used")
          .eq("key_string", alphaKey.trim())
          .single();

        if (keyError || !keyData) {
          errorMessage = "Invalid Alpha Key.";
          loading = false;
          return;
        }

        if (keyData.is_used) {
          errorMessage = "This Alpha Key has already been claimed.";
          loading = false;
          return;
        }

        // 2. Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              alpha_key: alphaKey.trim(),
            },
          },
        });

        if (error) throw error;
        
        // 3. Mark key as used (Ideally done via a db trigger upon user 'insert' in auth.users, but for client side logic:)
        await supabase
          .from("alpha_keys")
          .update({ is_used: true, claimed_at: new Date().toISOString() })
          .eq("id", keyData.id);
        
        successMessage = "Account created successfully! You may now log in.";
        mode = "login";
        password = "";
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Redirect to dashboard on login
        goto("/dashboard");
      }
    } catch (err: any) {
      errorMessage = err.message || "An unexpected error occurred.";
    } finally {
      loading = false;
    }
  };
</script>

<svelte:head>
  <title>{mode === "login" ? "Login" : "Sign Up"} | Maintainer One</title>
</svelte:head>

<div class="min-h-[calc(100vh-3rem)] bg-black text-gray-200 flex flex-col items-center justify-center p-6 selection:bg-red-900 selection:text-stone-200 font-mono relative overflow-hidden">
  
  <!-- Background Elements -->
  <div class="absolute inset-0 z-0 pointer-events-none opacity-20">
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-900/40 rounded-full blur-[100px]"></div>
  </div>
  
  <div class="z-10 w-full max-w-md">
    <div class="text-center mb-10">
      <M1Logo class="w-16 h-16 mx-auto mb-6 drop-shadow-[0_0_10px_rgba(220,38,38,0.4)]" />
      <h1 class="text-3xl font-bold tracking-tighter text-white uppercase">
        {mode === 'login' ? 'System Login' : 'Initialize Account'}
      </h1>
      <p class="text-sm text-gray-500 mt-2">
        {mode === 'login' ? 'Authenticate to access Maintainer One UI.' : 'An Alpha Key is required for system access.'}
      </p>
    </div>

    <div class="bg-gray-900/50 border border-gray-800 p-8 rounded-sm shadow-2xl backdrop-blur-sm relative">
      <!-- Decorative Corners -->
      <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500"></div>
      <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500"></div>
      <div class="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-500"></div>
      <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500"></div>

      {#if errorMessage}
        <div class="mb-6 p-3 bg-red-900/20 border-l-2 border-red-500 text-red-400 text-sm">
          {errorMessage}
        </div>
      {/if}

      {#if successMessage}
        <div class="mb-6 p-3 bg-green-900/20 border-l-2 border-green-500 text-green-400 text-sm">
          {successMessage}
        </div>
      {/if}

      <form onsubmit={handleAuth} class="space-y-6">
        {#if mode === 'signup'}
          <div>
            <label class="block text-xs uppercase tracking-wider text-gray-500 mb-2" for="alphaKey">Alpha Key</label>
            <input 
              id="alphaKey" 
              type="text" 
              bind:value={alphaKey}
              class="w-full bg-black border border-gray-800 p-3 text-stone-200 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors uppercase"
              placeholder="XXXX-XXXX-XXXX"
            />
          </div>
        {/if}

        <div>
          <label class="block text-xs uppercase tracking-wider text-gray-500 mb-2" for="email">Email</label>
          <input 
            id="email" 
            type="email" 
            bind:value={email}
            required
            class="w-full bg-black border border-gray-800 p-3 text-stone-200 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
            placeholder="maintainer@example.com"
          />
        </div>

        <div>
          <label class="block text-xs uppercase tracking-wider text-gray-500 mb-2" for="password">Password</label>
          <input 
            id="password" 
            type="password" 
            bind:value={password}
            required
            class="w-full bg-black border border-gray-800 p-3 text-stone-200 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          class="w-full bg-red-700/20 hover:bg-red-700/40 text-red-50 border border-red-700/50 hover:border-red-500 p-3 font-bold uppercase tracking-widest text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : (mode === 'login' ? 'Authenticate' : 'Submit & Create')}
        </button>
      </form>

      <div class="mt-8 text-center border-t border-gray-800/50 pt-6">
        <button 
          onclick={toggleMode}
          class="text-xs text-gray-500 hover:text-stone-300 uppercase tracking-wider transition-colors"
        >
          {mode === 'login' ? 'Enter Alpha Key' : 'Return to Login'}
        </button>
      </div>
    </div>
  </div>
</div>
