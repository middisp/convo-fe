<script>
  import { curRoute } from "../store.js";

  export let page = {
    path: "/",
    name: "Login"
  };

  const navigateTo = event => {
    curRoute.set(event.target.pathname);
    window.history.pushState(
      { path: page.path },
      "",
      window.location.origin + page.path
    );
  };
</script>

<a href={page.path} on:click|preventDefault={navigateTo}>{page.name}</a>
