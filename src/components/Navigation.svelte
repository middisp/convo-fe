<script>
  import router, { curRoute } from "../router.js";
  import RouterLink from "../components/RouterLink.svelte";

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
</script>

<style>
  ul {
    display: flex;
    justify-content: space-between;
    list-style: none;
    margin: 0;
    padding: 0;
  }
</style>

<nav>
  <ul>
    <li>
      <RouterLink page={{ path: '/home', name: 'Home' }} />
    </li>
    <li>
      <RouterLink page={{ path: '/about', name: 'About' }} />
    </li>
  </ul>
</nav>
