<script>
  import { onMount } from "svelte";
  import router from "./router.js";

  import { curRoute, user, isLoggedIn, token } from "./store.js";
  import Header from "./components/Header.svelte";
  import Navigation from "./components/Navigation.svelte";

  let toggleNav = false;

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
      curRoute.set("/");
      window.history.pushState({ path: "/" }, "", window.location.origin + "/");
    }
  };
</script>

<svelte:window on:popstate={handleBackNavigation} on:storage={syncLogOut} />

<svelte:head>
  <title>Convo - {router[$curRoute].title}</title>
</svelte:head>

<Header showNav={$isLoggedIn} bind:toggleNav />
{#if $isLoggedIn}
  <Navigation bind:toggleNav />
{/if}
<main id="pageContent">
  <svelte:component this={router[$curRoute].view} />
</main>
