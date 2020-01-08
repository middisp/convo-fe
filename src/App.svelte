<script>
  import router, { curRoute } from "./router.js";
  import Navigation from "./components/Navigation.svelte";

  function handleBackNavigation(event) {
    curRoute.set(event.state.path);
  }
</script>

<svelte:window on:popstate={handleBackNavigation} />

<main id="pageContent">
  <Navigation />
  <svelte:component this={router[$curRoute]} />

</main>
