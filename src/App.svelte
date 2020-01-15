<script>
  import router from "./router.js";
  import { curRoute, user, isLoggedIn } from "./store.js";
  import Navigation from "./components/Navigation.svelte";

  function handleBackNavigation(event) {
    curRoute.set(event.state.path);
  }
</script>

<svelte:window on:popstate={handleBackNavigation} />

<svelte:head>
  <title>Convo - {router[$curRoute].title}</title>
</svelte:head>

<main id="pageContent">
  {#if isLoggedIn}
    <Navigation />
  {/if}
  <svelte:component this={router[$curRoute].view} />
  {JSON.stringify($user)}
</main>
