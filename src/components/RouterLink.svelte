<script>
  import { link } from "svelte-spa-router";
  import { navOpen } from "../store.js";

  export let page = {
    path: "/",
    name: "Login"
  };
</script>

<style>
  a {
    color: inherit;
    text-decoration: none;
  }
</style>

<a
  href={page.path}
  use:link
  on:click={() => {
    navOpen.set(false);
  }}>
  {page.name}
</a>
