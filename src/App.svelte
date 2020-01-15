<script>
  import { onMount } from "svelte";
  import router from "./router.js";

  import { curRoute, user, isLoggedIn, token } from "./store.js";
  import Navigation from "./components/Navigation.svelte";

  onMount(() => {
    curRoute.set(window.location.pathname);
    if (!history.state) {
      window.history.replaceState(
        { path: window.location.pathname },
        "",
        window.location.href
      );
    }
  });

  const handleBackNavigation = event => {
    curRoute.set(event.state.path);
  };

  const syncLogOut = evt => {
    if (evt.key === "logout") {
      console.log("logged out from storage!");
      window.history.pushState(
        { path: "/home" },
        "",
        window.location.origin + "/home"
      );
    }
  };
</script>

<svelte:window on:popstate={handleBackNavigation} on:storage={syncLogOut} />

<svelte:head>
  <title>Convo - {router[$curRoute].title}</title>
</svelte:head>

<main id="pageContent">
  {#if $isLoggedIn}
    <Navigation />
  {/if}
  <svelte:component this={router[$curRoute].view} />
</main>
