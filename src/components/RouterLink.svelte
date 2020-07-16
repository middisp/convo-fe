<script>
  import { link } from "svelte-spa-router";

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

<a href={page.path} use:link>{page.name}</a>
