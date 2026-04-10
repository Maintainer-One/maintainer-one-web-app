<script lang="ts">
  import { goto } from "$app/navigation";
  import "./layout.css";
  import favicon from "$lib/assets/outlined-logo.svg";

  let { children } = $props();

  function handleKeydown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "l") {
      event.preventDefault();
      goto("/login");
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  <link href={favicon} rel="icon" />
</svelte:head>

<div data-component="page-layout">
  {@render children()}
</div>
