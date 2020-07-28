<script>
  import { onMount } from "svelte";
  import Router, { link, location, push } from "svelte-spa-router";

  import routes from "./routes";
  import Login from "./Views/Login.svelte";
  import { user, isLoggedIn, token } from "./store.js";
  import Header from "./components/Header.svelte";
  import Navigation from "./components/Navigation.svelte";

  const syncLogOut = evt => {
    if (evt.key === "logout") {
      // remove token et al.
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("logout");
      // redirect to login
      push("/");
    }
  };

  onMount(() => {
    if (!$user) {
      if (sessionStorage.getItem("user")) {
        user.set(JSON.parse(sessionStorage.getItem("user")));
      } else {
        push("/");
      }
    }
  });
</script>

<svelte:window on:storage={syncLogOut} />

<svelte:head>
  <title>Convo - {$location}</title>
</svelte:head>

<Header showNav={$isLoggedIn} />
{#if $isLoggedIn}
  <Navigation />
{/if}

<main id="pageContent">
  {#if $user}
    <Router {routes} />
  {:else}
    <Login />
  {/if}
</main>
