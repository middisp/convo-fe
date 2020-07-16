<script>
  import Router, { link, location } from "svelte-spa-router";

  import routes from "./routes";
  import { user, isLoggedIn, token } from "./store.js";
  import Header from "./components/Header.svelte";
  import Navigation from "./components/Navigation.svelte";

  let toggleNav = false;

  const syncLogOut = evt => {
    if (evt.key === "logout") {
    }
  };
</script>

<svelte:window on:storage={syncLogOut} />

<svelte:head>
  <title>Convo - {$location}</title>
</svelte:head>

<Header showNav={$isLoggedIn} bind:toggleNav />
{#if $isLoggedIn}
  <Navigation bind:toggleNav />
{/if}
<main id="pageContent">
  <Router {routes} />
</main>
