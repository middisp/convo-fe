<script>
  import router, { curRoute } from "./router.js";
  import RouterLink from "./components/RouterLink.svelte";

  import { onMount } from "svelte";

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

  function handleBackNavigation(event) {
    curRoute.set(event.state.path);
  }
</script>

<svelte:window on:popstate={handleBackNavigation} />
<RouterLink page={{ path: '/home', name: 'Home' }} />
<RouterLink page={{ path: '/about', name: 'About' }} />

<main id="pageContent">
  <svelte:component this={router[$curRoute]} />
</main>
