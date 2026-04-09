<script lang="ts">
  import "./layout.css";
  import favicon from "$lib/assets/outlined-logo.svg";

  let { children } = $props();
</script>

<svelte:head>
  <link href={favicon} rel="icon" />
</svelte:head>

<div data-component="page-layout">
  {@render children()}
</div>
