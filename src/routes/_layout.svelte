<script>
  import { curRoute, user, isLoggedIn, token } from "../store.js";
  import Header from "../components/Header.svelte";
  import Navigation from "../components/Navigation.svelte";

  export let segment;
</script>

<Header showNav={$isLoggedIn} />
{#if $isLoggedIn}
  <Navigation {segment} />
{/if}

<main>
  <slot />
</main>
